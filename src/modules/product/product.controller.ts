import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { HttpResponse } from "../../common/utils/response.js";
import { ProductRepository } from "./product.repository.js";
import { ProductService } from "./product.service.js";
import { createProductValidation, deleteProductValidation, getProductPerBusinessValidation, getProductsValidation, updateProductParamValidation, updateProductValidation } from "./product.validatiton.js";
import type { ProductUnitEnum } from "../../common/enums/product.js";
import { BusinessService } from "../business/business.service.js";
import { BusinessRepository } from "../business/business.repository.js";
import { TransactionRepository } from "../transaction/transaction.repository.js";
import { ActivityRepository } from "../activity/activity.repository.js";


const productRepository = new ProductRepository()
const activityRepository = new ActivityRepository()
const productService = new ProductService(productRepository, activityRepository)
const businessRepository = new BusinessRepository()
const businessService = new BusinessService(businessRepository)

export const productController = new Hono()
    .post(
        "/",
        authMiddleware,
        sValidator('form', createProductValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const { image, name, unit, stock, price } = c.req.valid('form')
            const craete = await productService.createProduct(business.id, image, name, unit as ProductUnitEnum, stock, price)
            return HttpResponse(c, "Berhasil membuat product", 201, craete, null)
        }
    )
    .delete(
        '/:productId',
        authMiddleware,
        sValidator('param', deleteProductValidation),
        async (c) => {
            const { productId } = c.req.valid('param')
            const deleteProduct = await productService.deleteProduct(productId)
            return HttpResponse(c, "Berhasil mengahus product", 200, deleteProduct, null)
        }
    )
    .put(
        '/:productId',
        authMiddleware,
        sValidator('param', updateProductParamValidation),
        sValidator('form', updateProductValidation),
        async (c) => {
            const { productId } = c.req.valid('param')
            const { image, name, unit } = c.req.valid('form')
            const updateProduct = await productService.updateProduct(productId, image || null, name, unit as ProductUnitEnum)
            return HttpResponse(c, "Berhasil mengahus product", 200, updateProduct, null)
        }
    )
    .get(
        '/',
        authMiddleware,
        sValidator('query', getProductsValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const { search } = c.req.valid('query')
            const products = await productService.getProducts(business.id, search || '')
            return HttpResponse(c, "Berhasil mendapatkan product analisis per minggu", 200, products, null)
        }
    )
    .get(
        '/summary',
        authMiddleware,
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const summary = await productService.getProductSummary(business.id)
            return HttpResponse(c, "Berhasil mendapatkan product analisis per minggu", 200, summary, null)
        }
    )