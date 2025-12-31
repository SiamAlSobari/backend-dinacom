import { HTTPException } from "hono/http-exception";
import { uploadImageToR2 } from "../../common/utils/upload-to-r2.js";
import type { ProductRepository } from "./product.repository.js";
import type { ProductUnitEnum } from "../../common/enums/product.js";

export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository
    ) { }

    public async createProduct(businessId: string, image: File, name: string, unit: ProductUnitEnum, stock: number) {
        // upload gambar -> convert ke url
        const imageUrl = await uploadImageToR2(image)
        console.log(imageUrl)
        if (!imageUrl) throw new HTTPException(400, { message: "Gagal convert gambar ke url" })

        // Buat product
        const product = await this.productRepository.create(businessId, imageUrl, name, unit, stock)

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
}