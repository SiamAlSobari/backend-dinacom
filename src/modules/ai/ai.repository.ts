import type { TransactionRow } from "../../common/interfaces/transaction_row.js";
import type { AIForecastResponse } from "../../common/interfaces/ai-response.js";
import { prisma } from "../../common/utils/db.js";


export class AiRepository {
    public async getAllProducts(businessId: string) {
        return prisma.products.findMany({
            where: {
                business_id: businessId,
                deleted_at: null,
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                unit: true,
                image_url: true, 
            },
            orderBy: { created_at: "asc" },
        });
    }

    public async getStockMap(businessId: string) {
        const rows = await prisma.stocks.findMany({
            where: {
                deleted_at: null,
                product: {
                    business_id: businessId,
                    deleted_at: null,
                    is_active: true,
                },
            },
            select: {
                product_id: true,
                stock_on_hand: true,
            },
        });

        const map = new Map<string, number>();
        for (const r of rows) {
            map.set(r.product_id, r.stock_on_hand);
        }
        return map;
    }

    public async getAllTrxRows(businessId: string, from: Date, to: Date) {
        const rows: TransactionRow[] = await prisma.transactionItems.findMany({
            where: {
                deleted_at: null,
                transaction: {
                    deleted_at: null,
                    business_id: businessId,
                    trx_type: { in: ["SALE", "PURCHASE", "ADJUSTMENT"] },
                    trx_date: { gte: from, lte: to },
                },
            },
            select: {
                product_id: true,
                quantity: true,
                transaction: { select: { trx_date: true, trx_type: true } },
            },
        });
        return rows;
    }

    public async createAiRun(businessId: string, generatedAt: Date) {
        return await prisma.aiRuns.create({
            data: {
                business_id: businessId,
                status: 'COMPLETED',
                generated_at: generatedAt,
                error_message: null,
            },
        });
    }

    public async createAiInsights(data: {
        ai_run_id: string;
        pattern_trend_summary: string;
        urgent: string;
        medium: string;
        low: string;
    }) {
        return await prisma.aiInsights.create({
            data,
        });
    }

    public async createAiRecommendation(data: {
        ai_run_id: string;
        product_id: string;
        current_stock: number;
        recommended_action: 'RESTOCK' | 'WAIT' | 'REDUCE';
        quantity_min: number;
        quantity_max: number;
        risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
        days_until_stockout: number;
        reason_text: string;
    }) {
        return await prisma.aiRecommendations.create({
            data,
        });
    }

    public async getLatestAiRun(businessId: string) {
        return await prisma.aiRuns.findFirst({
            where: {
                business_id: businessId,
                status: 'COMPLETED',
                deleted_at: null,
            },
            include: {
                insights: {
                    where: { deleted_at: null },
                },
                ai_recommendations: {
                    where: { deleted_at: null },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                unit: true,
                                image_url: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                generated_at: 'desc',
            },
        });
    }

    public async updateAiRunStatus(aiRunId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string) {
        return await prisma.aiRuns.update({
            where: { id: aiRunId },
            data: {
                status,
                error_message: errorMessage,
            },
        });
    }
}