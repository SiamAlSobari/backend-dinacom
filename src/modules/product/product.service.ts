import { HTTPException } from "hono/http-exception";
import { uploadImageToR2 } from "../../common/utils/upload-to-r2.js";
import type { ProductRepository } from "./product.repository.js";
import type { ProductUnitEnum } from "../../common/enums/product.js";
import type { ActivityRepository } from "../activity/activity.repository.js";
import type { ActivityType } from "../../../generated/prisma/enums.js";
import type { ProductSummary } from "../../common/interfaces/product.js";

export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository,
        public readonly activityRepository: ActivityRepository
    ) { }

    public async createProduct(businessId: string, image: File, name: string, unit: ProductUnitEnum, stock: number, price: number) {
        // upload gambar -> convert ke url
        const imageUrl = await uploadImageToR2(image)
        console.log(imageUrl)
        if (!imageUrl) throw new HTTPException(400, { message: "Gagal convert gambar ke url" })

        // Buat product
        const product = await this.productRepository.create(businessId, imageUrl, name, unit, stock, price)
        await this.activityRepository.createActivity(
            businessId,
            `Produk ${name} telah ditambahkan dengan stok awal ${stock}.`,
            'PRODUCT_CREATED' as ActivityType
        )
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

    async getProductSummary(businessId: string): Promise<ProductSummary[]> {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const products = await this.productRepository.findProductSummaryRaw(
            businessId,
            sevenDaysAgo
        )

        return products.map((p) => {
            const currentStock =
                p.stocks.reduce((a, b) => a + b.stock_on_hand, 0) || 0

            const sold7d =
                p.transaction_items.reduce((a, b) => a + b.quantity, 0) || 0

            let status: ProductSummary["status"] = "SAFE"

            if (currentStock === 0) status = "OUT"
            else if (currentStock < 10 && sold7d > 20) status = "CRITICAL"
            else if (currentStock < 10) status = "LOW"

            return {
                productId: p.id,
                product: p.name,
                currentStock,
                sold7d,
                status,
            }
        })
    }
}