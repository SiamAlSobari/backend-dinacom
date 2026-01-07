import { Hono } from "hono";
import { StockRepository } from "./stock.repository.js";
import { StockService } from "./stock.service.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { DeleteStockValidation, GetStockValidation, SetStockValidation } from "./stock.validation.js";
import { HttpResponse } from "../../common/utils/response.js";
import { BusinessRepository } from "../business/business.repository.js";
import { BusinessService } from "../business/business.service.js";

const stockRepository = new StockRepository()
const stockService = new StockService(stockRepository)
const businessRepository = new BusinessRepository()
const businessService = new BusinessService(businessRepository)
 

 export const stockController = new Hono()
    .post(
        '/set',
        authMiddleware,
        sValidator('json', SetStockValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const { items } = c.req.valid('json')
            const stock = await stockService.setStock(business.id,items)
            return HttpResponse(c, "Berhasil set stock", 201, stock, null)
        }
    )
    .get(
        '/',
        authMiddleware,
        sValidator('param', GetStockValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const stock = await stockService.getStock(business.id)
            return HttpResponse(c, "Berhasil mendapatkan stock per produk", 200, stock, null)
        }
    )
    .delete(
        '/:stockId',
        authMiddleware,
        sValidator('param', DeleteStockValidation),
        async (c) => {
            const { stockId } = c.req.valid('param')
            const stock = await stockService.deleteStock(stockId)
            return HttpResponse(c, "Berhasil menghapus stock", 200, stock, null)
        }
    )

