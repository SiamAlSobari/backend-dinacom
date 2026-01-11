import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { BusinessRepository } from "../business/business.repository.js";
import { AnalyticRepository } from "./analytic.repository.js";
import { AnalyticService } from "./analytic.service.js";
import { HttpResponse } from "../../common/utils/response.js";


const businessRepository = new BusinessRepository()
const analyticRepository = new AnalyticRepository()
const analyticService = new AnalyticService(analyticRepository)

export const AnalyticsController = new Hono()
    .get("/sales-weekly",authMiddleware, async (c) => {
        const user = c.get('user')
        const business = await businessRepository.get(user.id)
        if (!business) {
            return HttpResponse(c, "business not found", 404, null, null);
        }
        const data =  await analyticService.getWeeklySales(business.id)
        return HttpResponse(c, "Weekly sales analytics data", 200, data, null)
    })
    .get('/sales-monthly', async (c) => {
        const user = c.get('user')
        const business = await businessRepository.get(user.id)
        if (!business) {
            return HttpResponse(c, "business not found", 404, null, null);
        }
        const data =  await analyticService.getMonthlySales(business.id)
        return HttpResponse(c, "Monthly sales analytics data", 200, data, null)
    })