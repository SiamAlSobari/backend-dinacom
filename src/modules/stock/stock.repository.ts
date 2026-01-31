import type { SetStockItem } from "../../common/interfaces/stock.js";
import { prisma } from "../../common/utils/db.js";

export class StockRepository {
    public async setStock(businessId: string, items: SetStockItem[]) {
        await prisma.$transaction(async (tx) => {
            // bikin transaksi ADJUSTMENT
            const trx = await tx.transactions.create({
                data: {
                    business_id: businessId,
                    trx_type: "ADJUSTMENT",
                    trx_date: new Date(),
                    discount_amount: 0,
                    total_amount: 0,
                    payment_method: "CASH",
                    subtotal_amount: 0
                }
            })

            for (const item of items) {

                // ambil stock saat ini
                const stock = await tx.stocks.findFirst({
                    where: {
                        product_id: item.product_id,
                        deleted_at: null
                    }
                });

                if (!stock) {
                    throw new Error(`Stock not found for product ${item.product_id}`);
                }

                // hitung delta
                const delta = item.stock - stock.stock_on_hand;

                await tx.transactionItems.create({
                    data: {
                        transaction_id: trx.id,
                        product_id: item.product_id,
                        quantity: delta,
                        unit_price: 0,
                        line_price: 0
                    }
                });

                // update stock on hand
                await tx.stocks.update({
                    where: { id: stock.id },
                    data: {
                        stock_on_hand: item.stock
                    }
                });

                await tx.aiRuns.create({
                    data: {
                        business_id: businessId,
                        status: "PROCESSING",
                        generated_at: new Date(),
                        error_message: ""
                    }
                });
            }
        })
    }

    public async softDeleteStock(stockId: string) {
        return await prisma.stocks.update({
            where: {
                deleted_at: null,
                id: stockId
            },
            data: {
                deleted_at: new Date()
            }
        })
    }

    public async getStock(businessId: string) {
        return await prisma.products.findMany({
            where: {
                business_id: businessId,
                deleted_at: null
            },
            include: {
                stocks: {
                    where: {
                        deleted_at: null
                    }
                }
            }
        })
    }

    public async updateStock(productId: string, stockOnHand: number) {
        return prisma.stocks.updateMany({
            where: {
                product_id: productId,
                deleted_at: null,
            },
            data: {
                stock_on_hand: stockOnHand,
            },
        })
    }
}