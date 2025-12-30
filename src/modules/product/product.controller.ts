import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { productValidation } from "./product.validate.js";
import { HttpResponse } from "../../common/utils/response.js";
import { ProductRepository } from "./product.repository.js";
import { ProductService } from "./product.service.js";


// Instansi classs 
const productRepository = new ProductRepository()
const productService = new ProductService(productRepository)

export const productController = new Hono()
    .post(
        "/",
        authMiddleware,
        sValidator('form', productValidation.create),
        async (c) => {
            const { image, business_id, name, unit, stock } = c.req.valid('form')
            const craete = await productService.createProduct(business_id,image,name,unit,stock)
            return HttpResponse(c, "Berhasil membuat product", 201, craete, null)
        }
    )
    .delete(
        '/:productId',
        authMiddleware,
        sValidator('param', productValidation.delete),
        async (c) => {
            const { productId } = c.req.valid('param')
            const deleteProduct = await productService.deleteProduct(productId)
            return HttpResponse(c, "Berhasil mengahus product", 200, deleteProduct, null)
        }   
    )
    .put(
        '/:productId',
        authMiddleware,
        sValidator('param', productValidation.updateParam),
        sValidator('form', productValidation.update),
        async (c) => {
            const { productId } = c.req.valid('param')
            const { image, name, unit } = c.req.valid('form')
            const updateProduct = await productService.updateProduct(productId,image || null,name,unit)
            return HttpResponse(c, "Berhasil mengahus product", 200, updateProduct, null)
        }
    )
    .get(
        '/:businessId',
        authMiddleware,
        sValidator('query', productValidation.getProducts),
        sValidator('param', productValidation.getProductPerBusiness),
        async (c) => {
            const { search } = c.req.valid('query')
            const { businessId } = c.req.valid('param')
            const products = await productService.getProducts(businessId,search || '')
            return HttpResponse(c, "Berhasil mendapatkan product", 200, products, null)
        }   
    )