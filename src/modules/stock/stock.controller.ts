import { Hono } from "hono";
import { StockRepository } from "./stock.repository.js";
import { StockService } from "./stock.service.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { SetStockValidation } from "./stock.validation.js";
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
            return HttpResponse(c, "Berhasil mengahus product", 200, stock, null)
        }
    )

