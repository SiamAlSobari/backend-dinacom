import type { SalesRow } from "../../common/interfaces/sales_row.js";
import type { TransactionRow } from "../../common/interfaces/transaction_row.js";
import type { AiRepository } from "./ai.repository.js";


function toYMD_WIB(d: Date) {
    const WIB_MS = 7 * 60 * 60 * 1000;
    return new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10);
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

function buildDateKeys(from: Date, to: Date) {
    const keys: string[] = [];
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

    public async buildAiDataset(businessId: string, fromDate: Date, toDate: Date) {
        const from = normalizeFrom(fromDate);
        const to = normalizeTo(toDate);

        const [products, stockMap, trxRows] = await Promise.all([
            this.aiRepository.getAllProducts(businessId),
            this.aiRepository.getStockMap(businessId),
            this.aiRepository.getAllTrxRows(businessId, from, to),
        ]);

    const productIds = products.map((p) => p.id);
    const dateKeys = buildDateKeys(from, to);
    const windowDays = dateKeys.length;

    const salesDayMap = new Map<string, Map<string, number>>();
    const purchaseDayMap = new Map<string, Map<string, number>>();
    const adjDayMap = new Map<string, Map<string, number>>();

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

    return {
        business_id: businessId,
        window_days: windowDays,
        as_of_date: toYMD_WIB(to),
        products: products.map((p) => {
        const current = stockMap.get(p.id) ?? 0;

        const sales = totalSales.get(p.id) ?? 0;
        const purchases = totalPurchases.get(p.id) ?? 0;
        const adjustments = totalAdjustments.get(p.id) ?? 0;

        const startStock = current - purchases - adjustments + sales;

        const sMap = salesDayMap.get(p.id)!;
        const pMap = purchaseDayMap.get(p.id)!;
        const aMap = adjDayMap.get(p.id)!;

        const daily_sales = dateKeys.map((d) => ({
            date: d,
            qty: sMap.get(d) ?? 0,
        }));

        const restocks = dateKeys
            .filter((d) => (pMap.get(d) ?? 0) !== 0)
            .map((d) => ({
            date: d,
            qty: pMap.get(d) ?? 0,
            note: "Restock",
        }));

        const adjustmentsArr = dateKeys
            .filter((d) => (aMap.get(d) ?? 0) !== 0)
            .map((d) => ({
            date: d,
            qty: aMap.get(d) ?? 0,
            reason: "Adjustment",
        }));

        return {
            product_id: p.id,
            product_name: p.name,
            unit: p.unit,
            image_url: (p as any).image_url ?? null,
            stock: {
            window_start_date: dateKeys[0],
            window_end_date: dateKeys[dateKeys.length - 1],
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
    }
}