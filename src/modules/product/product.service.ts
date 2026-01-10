import { HTTPException } from "hono/http-exception";
import { uploadImageToR2 } from "../../common/utils/upload-to-r2.js";
import type { ProductRepository } from "./product.repository.js";
import type { ProductUnitEnum } from "../../common/enums/product.js";
import type { TransactionRepository } from "../transaction/transaction.repository.js";

export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly transactionRepository: TransactionRepository
    ) { }

    public async createProduct(businessId: string, image: File, name: string, unit: ProductUnitEnum, stock: number, price: number) {
        // upload gambar -> convert ke url
        const imageUrl = await uploadImageToR2(image)
        console.log(imageUrl)
        if (!imageUrl) throw new HTTPException(400, { message: "Gagal convert gambar ke url" })

        // Buat product
        const product = await this.productRepository.create(businessId, imageUrl, name, unit, stock, price)

        return product
    }

    public async updateProduct(productId: string, image: File | null, name: string, unit: ProductUnitEnum) {
        // Ambil product
        const product = await this.productRepository.getProduct(productId)
        if (!product) throw new HTTPException(404, { message: "Product tidak ditemukan" })

        // Initialize imageUrl
        let imageUrl = product.image_url!

        // upload gambar -> convert ke url
        if (image) {
            imageUrl = await uploadImageToR2(image)
            if (!imageUrl) throw new HTTPException(400, { message: "Gagal convert gambar ke url" })
        }

        // Update product
        const updatedProduct = await this.productRepository.update(productId, imageUrl, name, unit)
        return updatedProduct
    }

    public async deleteProduct(productId: string) {
        // Hapus product
        const product = await this.productRepository.softDelete(productId)
        if (!product) throw new HTTPException(400, { message: "Gagal menghapus product" })

        return product
    }

    public async getProducts(businessId: string, search: string) {
        // Ambil product
        const products = await this.productRepository.getProducts(businessId, search)
        if (!products) throw new HTTPException(404, { message: "Product tidak ditemukan" })

        return products
    }

    public async getProductStock(businessId: string) {
        const products = await this.productRepository.getProductsByBusiness(businessId)
        if (!products) throw new HTTPException(404, { message: "Product tidak ditemukan" })
        const soldTotals = await this.transactionRepository.soldTotals(businessId)
        const soldPerWeek = await this.transactionRepository.soldPerWeek(businessId)
        const soldTotalMap = new Map<string, number>()

        // map sold totals
        soldTotals.forEach(s => {
            soldTotalMap.set(s.product_id, s._sum.quantity ?? 0)
        })

        // map sold per week
        const soldWeekMap = new Map<
            string,
            { week: Date; total_sold: number }[]
        >()

        // map semua sold 
        soldPerWeek.forEach(row => {
            if (!soldWeekMap.has(row.product_id)) {
                soldWeekMap.set(row.product_id, [])
            }
            soldWeekMap.get(row.product_id)!.push({
                week: row.week,
                total_sold: row.total_sold,
            })
        })

        const result = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            unit: p.unit,
            current_stock: p.stocks[0]?.stock_on_hand ?? 0,
            total_sold: soldTotalMap.get(p.id) ?? 0,
            sold_per_week: soldWeekMap.get(p.id) ?? [],
        }))

        return result
    }

    public async topSellingProducts(businessId: string, limit: number) {
        const topProductsData = await this.transactionRepository.topProductsSelling(businessId, limit)
        const products = await this.productRepository.getProductsByBusiness(businessId)
        const productMap = new Map(products.map(p => [p.id, p]))

        const result = topProductsData.map(tp => ({
            ...productMap.get(tp.product_id),
            total_sold: tp._sum.quantity ?? 0,
        }))

        return result
    }

    public async topSellingProductsByPeriod(businessId: string, period: 'week' | 'month' , limit: number) {
        const topProductsData = await this.transactionRepository.topSellingByPeriod(businessId, period, limit)
        if (topProductsData.length === 0) throw new HTTPException(404, { message: "Data tidak ditemukan" })
        return topProductsData
    }
}


