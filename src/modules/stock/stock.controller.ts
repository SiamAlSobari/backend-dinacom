import { Hono } from "hono";
import { StockRepository } from "./stock.repository.js";
import { StockService } from "./stock.service.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { DeleteStockValidation, GetStockValidation, SetStockValidation } from "./stock.validation.js";
import { HttpResponse } from "../../common/utils/response.js";

const stockRepository = new StockRepository()
 const stockService = new StockService(stockRepository)

 export const stockController = new Hono()
    .post(
        '/set',
        authMiddleware,
        sValidator('json', SetStockValidation),
        async (c) => {
            const { items,businessId } = c.req.valid('json')
            const stock = await stockService.setStock(businessId,items)
            return HttpResponse(c, "Berhasil set stock", 201, stock, null)
        }
    )
    .get(
        '/:businessId',
        authMiddleware,
        sValidator('param', GetStockValidation),
        async (c) => {
            const { businessId } = c.req.valid('param')
            const stock = await stockService.getStock(businessId)
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

