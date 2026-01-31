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

// NEW: Unit mapping helper
function mapUnitToAI(dbUnit: string): string {
    const unitMap: Record<string, string> = {
        'PCS': 'PCS',
        'BOX': 'BOX',
        'KG': 'KG',
        'LITER': 'LITER',
        'PACK': 'PACK',
        'BOTOL': 'BOTOL', // Support for BOTOL even if not in enum
    };
    return unitMap[dbUnit] || dbUnit;
}

export class AiService {
    constructor(private readonly aiRepository: AiRepository) {}

    public async analyzeAI(businessId: string, fromDate: Date, toDate: Date) {
        const from = normalizeFrom(fromDate);
        const to = normalizeTo(toDate);

        console.log(`[analyzeAI] Range: ${from.toISOString()} to ${to.toISOString()}`);

        // Build AI input
        const [products, stockMap, trxRows] = await Promise.all([
            this.aiRepository.getAllProducts(businessId),
            this.aiRepository.getStockMap(businessId),
            this.aiRepository.getAllTrxRows(businessId, from, to),
        ]);

        console.log(`[analyzeAI] Found ${products.length} products, ${trxRows.length} transaction items`);

        const productIds = products.map((p) => p.id);
        const dateKeys = buildDateKeys(from, to);
        const windowDays = dateKeys.length;

        console.log(`[analyzeAI] Date keys (${dateKeys.length}): ${dateKeys[0]} to ${dateKeys[dateKeys.length - 1]}`);

        // Initialize maps for each product
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

        // Process transactions - FIX: Proper date conversion
        for (const r of trxRows as TransactionRow[]) {
            const pid = r.product_id;
            if (!salesDayMap.has(pid)) {
                console.warn(`[analyzeAI] Transaction item for unknown product: ${pid}`);
                continue;
            }

            const day = toYMD_WIB(r.transaction.trx_date);
            const qty = r.quantity;
            const type = r.transaction.trx_type;

            // DEBUG logging for first few items
            if (trxRows.indexOf(r) < 3) {
                console.log(`[analyzeAI] Processing: product=${pid}, date=${day}, qty=${qty}, type=${type}`);
            }

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

        // Build AI input
        const aiInput: AIForecastInput = {
            business_id: businessId,
            window_days: windowDays,
            as_of_date: toYMD_WIB(to),
            products: products.map<AIProductInput>((p) => {
                const current = stockMap.get(p.id) ?? 0;

                const sales = totalSales.get(p.id) ?? 0;
                const purchases = totalPurchases.get(p.id) ?? 0;
                const adjustments = totalAdjustments.get(p.id) ?? 0;

                // Calculate start stock (ESTIMASI karena tidak ada snapshot harian)
                // Rumus: current_stock + sales - purchases - adjustments
                // Asumsi: current stock adalah hasil akhir setelah semua transaksi dalam window
                const startStock = Math.max(0, current + sales - purchases - adjustments);

                const sMap = salesDayMap.get(p.id) ?? new Map<YMDDateString, number>();
                const pMap = purchaseDayMap.get(p.id) ?? new Map<YMDDateString, number>();
                const aMap = adjDayMap.get(p.id) ?? new Map<YMDDateString, number>();

                // FIX: Fill ALL dates in window with 0 if missing
                const daily_sales: DailySalesRow[] = dateKeys.map((d) => ({
                    date: d,
                    qty: sMap.get(d) ?? 0,
                }));

                const restocks: RestockEvent[] = dateKeys
                    .filter((d) => (pMap.get(d) ?? 0) > 0)
                    .map((d) => ({
                        date: d,
                        qty: pMap.get(d)!,
                        note: 'Restock',
                    }));

                const adjustmentsArr: AdjustmentEvent[] = dateKeys
                    .filter((d) => {
                        const qty = aMap.get(d) ?? 0;
                        return qty !== 0;
                    })
                    .map((d) => ({
                        date: d,
                        qty: aMap.get(d)!,
                        reason: 'Adjustment',
                    }));

                const window_start_date = dateKeys[0];
                const window_end_date = dateKeys[dateKeys.length - 1];

                if (!window_start_date || !window_end_date) {
                    throw new Error('dateKeys is empty; cannot build stock window');
                }

                console.log(`[analyzeAI] Product ${p.name}: sales=${sales}, purchases=${purchases}, adj=${adjustments}, current=${current}, start=${startStock}`);

                return {
                    product_id: p.id,
                    product_name: p.name,
                    unit: mapUnitToAI(p.unit),
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

        console.log(`[analyzeAI] AI input generated: ${aiInput.products.length} products`);
        console.log(`[analyzeAI] Sample daily_sales for product 0: ${JSON.stringify(aiInput.products[0]?.daily_sales?.slice(0, 5))}`);

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
        const aiServiceUrl = process.env.FAST_API_URL;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 100_000);
        try {
            const res = await fetch(`${aiServiceUrl}/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`FastAPI error ${res.status}: ${text}`);
            }

            return await res.json();
        } finally {
            clearTimeout(timeout);
        }
    }

    private async saveAiRunResults(businessId: string, response: AIForecastResponse) {
        const aiRun = await this.aiRepository.createAiRun(
            businessId,
            new Date(response.generated_at)
        );

        try {
            // Save portfolio insights - handle optional ai_summary
            const aiSummary = response.portfolio_insights.ai_summary;
            await this.aiRepository.createAiInsights({
                ai_run_id: aiRun.id,
                pattern_trend_summary: aiSummary?.pattern_trend_summary ?? 'No summary available',
                urgent: aiSummary?.priority_actions.urgent ?? 'No urgent actions',
                medium: aiSummary?.priority_actions.medium ?? 'No medium priority actions',
                low: aiSummary?.priority_actions.low ?? 'No low priority actions',
            });

            // Save per-product recommendations
            for (const product of response.products) {
                await this.aiRepository.createAiRecommendation({
                    ai_run_id: aiRun.id,
                    product_id: product.product_id,
                    current_stock: product.current_stock,
                    recommended_action: this.mapRecommendationAction(product.recommendation.action),
                    quantity_min: product.recommendation.quantity_range.min,
                    quantity_max: product.recommendation.quantity_range.max,
                    risk_level: this.mapRiskLevel(product.stock_analysis.risk_level),
                    days_until_stockout: product.stock_analysis.days_until_stockout ?? 0,
                    reason_text: product.recommendation.reason,
                });
            }

            // NEW: Save full AI response (meta, forecasts, analysis)
            await this.saveDetailedAiOutput(aiRun.id, response);

            await this.aiRepository.updateAiRunStatus(aiRun.id, 'COMPLETED');
            return aiRun;
        } catch (error) {
            await this.aiRepository.updateAiRunStatus(
                aiRun.id,
                'FAILED',
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        }
    }

    private async saveDetailedAiOutput(aiRunId: string, response: AIForecastResponse) {
        await this.aiRepository.createAiRunMeta({
            ai_run_id: aiRunId,
            model_version: response.model_version,
            total_products: response.total_products,
            llm_enabled: response.llm_enabled,
            llm_success_count: response.llm_success_count,
            fallback_count: response.fallback_count,
            total_tokens_used: response.total_tokens_used,
        });

        await this.aiRepository.createAiPortfolioInsights({
            ai_run_id: aiRunId,
            summary: response.portfolio_insights.summary,
            trends: response.portfolio_insights.trends,
            priority_actions: response.portfolio_insights.priority_actions,
            risk_distribution: response.portfolio_insights.risk_distribution,
        });

        for (const product of response.products) {
            // Convert confidence to number if it's a string
            const confidenceValue = typeof product.forecast.confidence === 'string' 
                ? this.mapConfidenceToNumber(product.forecast.confidence)
                : product.forecast.confidence;

            // Save forecast
            await this.aiRepository.createAiForecast({
                ai_run_id: aiRunId,
                product_id: product.product_id,
                horizon_days: product.forecast.horizon_days,
                daily_forecast: product.forecast.daily,
                total_demand: product.forecast.total_demand,
                average_per_day: product.forecast.average_per_day,
                method: product.forecast.method,
                confidence: confidenceValue,
            });

            // Save product analysis
            await this.aiRepository.createAiProductAnalysis({
                ai_run_id: aiRunId,
                product_id: product.product_id,
                days_until_stockout: product.stock_analysis.days_until_stockout,
                risk_level: this.mapRiskLevel(product.stock_analysis.risk_level),
                urgency_score: product.stock_analysis.urgency_score,
                forecast_reliability: product.stock_analysis.forecast_reliability,
                priority_score: product.business_priority.priority_score,
                priority_tier: product.business_priority.priority_tier,
                sales_patterns: product.business_insights.sales_patterns,
            });
        }
    }

    private mapConfidenceToNumber(confidence: string): number {
        const confidenceMap: Record<string, number> = {
            'high': 95,
            'medium': 80,
            'low': 60,
        };
        return confidenceMap[confidence.toLowerCase()] ?? 70;
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

