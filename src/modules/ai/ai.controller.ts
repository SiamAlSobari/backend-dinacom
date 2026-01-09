import { Hono } from "hono";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";
import { sValidator } from "@hono/standard-validator";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { AiRangeValidation } from "./ai.validation.js";
import { BusinessRepository } from "../business/business.repository.js";
import { BusinessService } from "../business/business.service.js";
import { HttpResponse } from "../../common/utils/response.js";

const aiRepository = new AiRepository();
const aiService = new AiService(aiRepository);
const businessRepository = new BusinessRepository()
const businessService = new BusinessService(businessRepository)


export const aiController = new Hono()
    .post(
        "/analyze",
        authMiddleware,
        sValidator("json", AiRangeValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const { from, to } = c.req.valid('json');
            const analyze = await aiService.analyzeAI(business.id, from, to);
            return HttpResponse(c, "AI analysis completed and saved successfully", 201, analyze, null);
        }
    )
    .get(
        "/latest",
        authMiddleware,
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const latestRun = await aiService.getLatestAiRun(business.id);
            if (!latestRun) {
                return HttpResponse(c, "No AI analysis found", 404, null, null);
            }
            return HttpResponse(c, "Latest AI analysis retrieved successfully", 200, latestRun, null);
        }
    )