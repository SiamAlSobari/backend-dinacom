import type { AdjustmentEvent, AIForecastInput, AIProductInput, DailySalesRow, RestockEvent, YMDDateString } from "../../common/interfaces/ai.js";
import type { AIForecastResponse } from "../../common/interfaces/ai-response.js";
import type { TransactionRow } from "../../common/interfaces/transaction_row.js";
import type { AiRepository } from "./ai.repository.js";

function toYMD_WIB(d: Date): YMDDateString {
    const WIB_MS = 7 * 60 * 60 * 1000;
    return new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10) as YMDDateString;
}

function normalizeFrom(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function normalizeTo(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

function buildDateKeys(from: Date, to: Date): YMDDateString[] {
    const keys: YMDDateString[] = [];
    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    while (cur <= end) {
        keys.push(toYMD_WIB(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return keys;
}

export class AiService {
    constructor(private readonly aiRepository: AiRepository) {}

    public async analyzeAI(businessId: string, fromDate: Date, toDate: Date) {
        const from = normalizeFrom(fromDate);
        const to = normalizeTo(toDate);

        // Build AI input
        const [products, stockMap, trxRows] = await Promise.all([
            this.aiRepository.getAllProducts(businessId),
            this.aiRepository.getStockMap(businessId),
            this.aiRepository.getAllTrxRows(businessId, from, to),
        ]);

        const productIds = products.map((p) => p.id);
        const dateKeys = buildDateKeys(from, to);
        const windowDays = dateKeys.length;

        const salesDayMap = new Map<string, Map<YMDDateString, number>>();
        const purchaseDayMap = new Map<string, Map<YMDDateString, number>>();
        const adjDayMap = new Map<string, Map<YMDDateString, number>>();

        const totalSales = new Map<string, number>();
        const totalPurchases = new Map<string, number>();
        const totalAdjustments = new Map<string, number>();

        for (const pid of productIds) {
            salesDayMap.set(pid, new Map());
            purchaseDayMap.set(pid, new Map());
            adjDayMap.set(pid, new Map());

            totalSales.set(pid, 0);
            totalPurchases.set(pid, 0);
            totalAdjustments.set(pid, 0);
        }

        for (const r of trxRows as TransactionRow[]) {
            const pid = r.product_id;
            if (!salesDayMap.has(pid)) continue;

            const day = toYMD_WIB(r.transaction.trx_date);
            const qty = r.quantity;
            const type = r.transaction.trx_type;

            if (type === "SALE") {
                const m = salesDayMap.get(pid)!;
                m.set(day, (m.get(day) ?? 0) + qty);
                totalSales.set(pid, (totalSales.get(pid) ?? 0) + qty);
            } else if (type === "PURCHASE") {
                const m = purchaseDayMap.get(pid)!;
                m.set(day, (m.get(day) ?? 0) + qty);
                totalPurchases.set(pid, (totalPurchases.get(pid) ?? 0) + qty);
            } else if (type === "ADJUSTMENT") {
                const m = adjDayMap.get(pid)!;
                m.set(day, (m.get(day) ?? 0) + qty); 
                totalAdjustments.set(pid, (totalAdjustments.get(pid) ?? 0) + qty);
            }
        }

        const aiInput: AIForecastInput = {
            business_id: businessId,
            window_days: windowDays,
            as_of_date: toYMD_WIB(to), 
            products: products.map<AIProductInput>((p) => {
                const current = stockMap.get(p.id) ?? 0;

                const sales = totalSales.get(p.id) ?? 0;
                const purchases = totalPurchases.get(p.id) ?? 0;
                const adjustments = totalAdjustments.get(p.id) ?? 0;

                const startStock = current - purchases - adjustments + sales;

                const sMap = salesDayMap.get(p.id) ?? new Map<YMDDateString, number>();
                const pMap = purchaseDayMap.get(p.id) ?? new Map<YMDDateString, number>();
                const aMap = adjDayMap.get(p.id) ?? new Map<YMDDateString, number>();

                const daily_sales: DailySalesRow[] = dateKeys.map((d) => ({
                    date: d,
                    qty: sMap.get(d) ?? 0,
                }));

                const restocks: RestockEvent[] = dateKeys
                    .filter((d) => (pMap.get(d) ?? 0) !== 0)
                    .map((d) => ({
                        date: d,
                        qty: pMap.get(d) ?? 0,
                        note: 'Restock',
                    }));

                const adjustmentsArr: AdjustmentEvent[] = dateKeys
                    .filter((d) => (aMap.get(d) ?? 0) !== 0)
                    .map((d) => ({
                        date: d,
                        qty: aMap.get(d) ?? 0,
                        reason: 'Adjustment',
                    }));

                const window_start_date = dateKeys[0];
                const window_end_date = dateKeys[dateKeys.length - 1];
                
                if (!window_start_date || !window_end_date) {
                    throw new Error('dateKeys is empty; cannot build stock window');
                }

                return {
                    product_id: p.id,
                    product_name: p.name,
                    unit: p.unit,
                    image_url: p.image_url ?? null,
                    stock: {
                        window_start_date,
                        window_end_date,
                        start_stock_on_hand: startStock,
                        current_stock_on_hand: current,
                    },
                    daily_sales,
                    events: {
                        restocks,
                        adjustments: adjustmentsArr,
                    },
                };
            }),
        };

        console.log(`ai input ${JSON.stringify(aiInput).length} bytes for ${aiInput.products.length} products over ${aiInput.window_days} days`);
       console.log(`sample product input: ${JSON.stringify(aiInput.products[0])}`);
       console.log(`product total sales 1: ${totalSales.get(aiInput.products[0].product_id)}`);
       console.log(`product total sales 2 : ${totalSales.get(aiInput.products[1].product_id)}`);

        // Call AI forecast service
        const aiResponse = await this.callForecast(aiInput);

        // Save AI run results to database
        const savedRun = await this.saveAiRunResults(businessId, aiResponse);

        return {
            ai_run_id: savedRun.id,
            ...aiResponse
        };
    }

    public async callForecast(payload: AIForecastInput): Promise<AIForecastResponse> {
        const aiServiceUrl = process.env.FAST_API_URL
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 100_000) 
        try {
            const res = await fetch(`${aiServiceUrl}/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })

            if (!res.ok) {
                const text = await res.text().catch(() => '')
                throw new Error(`FastAPI error ${res.status}: ${text}`)
            }

            return await res.json();
        } finally {
            clearTimeout(timeout)
        }
    }

    private async saveAiRunResults(businessId: string, response: AIForecastResponse) {
        // Create AI Run header
        const aiRun = await this.aiRepository.createAiRun(
            businessId,
            new Date(response.generated_at)
        );

        try {
            // Create AI Insights
            await this.aiRepository.createAiInsights({
                ai_run_id: aiRun.id,
                pattern_trend_summary: response.portfolio_insights.ai_summary.pattern_trend_summary,
                urgent: response.portfolio_insights.ai_summary.priority_actions.urgent,
                medium: response.portfolio_insights.ai_summary.priority_actions.medium,
                low: response.portfolio_insights.ai_summary.priority_actions.low,
            });

            // Create AI Recommendations for each product
            for (const product of response.products) {
                await this.aiRepository.createAiRecommendation({
                    ai_run_id: aiRun.id,
                    product_id: product.product_id,
                    current_stock: product.current_stock,
                    recommended_action: this.mapRecommendationAction(product.recommendation.action),
                    quantity_min: product.recommendation.quantity_range.min,
                    quantity_max: product.recommendation.quantity_range.max,
                    risk_level: this.mapRiskLevel(product.stock_analysis.risk_level),
                    days_until_stockout: product.stock_analysis.days_until_stockout !== null 
                        ? product.stock_analysis.days_until_stockout 
                        : 0,
                    reason_text: product.recommendation.reason,
                });
            }

            return aiRun;
        } catch (error) {
            await this.aiRepository.updateAiRunStatus(aiRun.id, 'FAILED', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    private mapRecommendationAction(action: string): 'RESTOCK' | 'WAIT' | 'REDUCE' {
        const upperAction = action.toUpperCase();
        if (upperAction === 'RESTOCK') return 'RESTOCK';
        if (upperAction === 'REDUCE') return 'REDUCE';
        return 'WAIT';
    }

    private mapRiskLevel(riskLevel: string): 'HIGH' | 'MEDIUM' | 'LOW' {
        const upperRisk = riskLevel.toUpperCase();
        if (upperRisk === 'HIGH') return 'HIGH';
        if (upperRisk === 'MEDIUM') return 'MEDIUM';
        return 'LOW';
    }

    public async getLatestAiRun(businessId: string) {
        return await this.aiRepository.getLatestAiRun(businessId);
    }
}

