import { Hono } from "hono";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";
import { sValidator } from "@hono/standard-validator";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { AiRangeValidation } from "./ai.validation.js";
import { BusinessRepository } from "../business/business.repository.js";
import { BusinessService } from "../business/business.service.js";
import { HttpResponse } from "../../common/utils/response.js";
import { prisma } from "../../common/utils/db.js";

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
    .get(
        '/recommendation',
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
            const recommendations = await prisma.aiRecommendations.findMany({
                where: {
                    ai_run: {
                        business_id: business.id,
                        id: latestRun.id
                    }
                },
                include: {
                    product: true
                }
            });
            return HttpResponse(c, "AI recommendations retrieved successfully", 200, recommendations, null);
        }
    )
    .patch(
        '/recommendation/:recommendationId',
        authMiddleware,
        async (c) => {
            const recommendationId = c.req.param('recommendationId')

            // ambil recommendation + product + stock
            const recommendation = await prisma.aiRecommendations.findFirst({
                where: {
                    id: recommendationId,
                    deleted_at: null,
                },
                include: {
                    product: {
                        include: {
                            stocks: true,
                        },
                    },
                },
            })

            if (!recommendation) {
                return c.json({ message: 'Recommendation not found' }, 404)
            }

            const stock = recommendation.product.stocks[0]
            if (!stock) {
                return c.json({ message: 'Stock not found' }, 404)
            }

            let newStock = stock.stock_on_hand

            // === LOGIC AI ACTION ===
            if (recommendation.recommended_action === 'RESTOCK') {
                newStock += recommendation.quantity_max
            }

            if (recommendation.recommended_action === 'REDUCE') {
                newStock -= recommendation.quantity_max
                if (newStock < 0) newStock = 0
            }

            // WAIT → gak berubah

            // === TRANSACTION ===
            await prisma.$transaction([
                // update stock
                prisma.stocks.update({
                    where: { id: stock.id },
                    data: {
                        stock_on_hand: newStock,
                    },
                }),

                // update recommendation jadi WAIT
                prisma.aiRecommendations.update({
                    where: { id: recommendation.id },
                    data: {
                        current_stock: newStock,
                        recommended_action: 'WAIT',
                    },
                }),
            ])

            return c.json({
                message: 'Recommendation applied',
                product_id: recommendation.product_id,
                previous_stock: stock.stock_on_hand,
                current_stock: newStock,
                action: 'WAIT',
            })
        }
    )
    .get(
        '/priority',
        authMiddleware,
        async (c) => {
            const user = c.get('user')

            const business = await businessService.getBusiness(user.id)
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null)
            }

            const latestAiRun = await aiService.getLatestAiRun(business.id)
            if (!latestAiRun) {
                return HttpResponse(c, "No AI analysis found", 404, null, null)
            }

            const portfolio = await prisma.aiPortfolioInsights.findUnique({
                where: {
                    ai_run_id: latestAiRun.id
                },
                select: {
                    priority_actions: true
                }
            })

            if (!portfolio || !portfolio.priority_actions) {
                return HttpResponse(c, "No priority actions found", 404, [], null)
            }

            // 🔥 SORT DI BACKEND (karena JSON)
            const sortedPriorityActions = (
                portfolio.priority_actions as any[]
            ).sort(
                (a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)
            )

            return HttpResponse(
                c,
                "AI priority actions retrieved successfully",
                200,
                sortedPriorityActions,
                null
            )
        }
    )
    .get(
        '/recommendation/high-risk',
        authMiddleware,
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            const latestRun = await aiService.getLatestAiRun(business.id);
            const recommendations = await prisma.aiRecommendations.findMany({
                where: {
                    ai_run: {
                        business_id: business.id,
                        id: latestRun?.id,
                    },
                    risk_level: 'HIGH',

                },
                include: {
                    product: true
                },
                take: 5,

            });
            return HttpResponse(c, "AI recommendations retrieved successfully", 200, recommendations, null);
        }
    )
    .get(
        '/insights',
        authMiddleware,
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id)
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null)
            }
            const latestAiRun = await aiService.getLatestAiRun(business.id)
            if (!latestAiRun) {
                return HttpResponse(c, "No AI analysis found", 404, null, null)
            }

            const insights = await prisma.aiInsights.findFirst({
                where: {
                    ai_run_id: latestAiRun.id
                }
            })
            return HttpResponse(c, "AI insights retrieved successfully", 200, insights, null)
        }
    )

