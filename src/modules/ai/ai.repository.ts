import type { TransactionRow } from "../../common/interfaces/transaction_row.js";
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
}