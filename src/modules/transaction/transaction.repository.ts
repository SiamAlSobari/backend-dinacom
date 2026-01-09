import type { Transactions } from "../../../generated/prisma/client.js";
import { TrxTypeEnum } from "../../common/enums/transaction.js";
import type { TransactionItem } from "../../common/interfaces/transaction.js";
import { prisma } from "../../common/utils/db.js";
import type { TransactionItemType } from "./transaction.validation.js";

export class TransactionRepository {
    public async createBulk(businessId: string, items: TransactionItemType[]) {
        const res = [] as Transactions[]
        await prisma.$transaction(async (tx) => {

            for (const item of items) {
                const trx = await tx.transactions.create({
                    data: {
                        business_id: businessId,
                        trx_type: item.trx_type,
                        trx_date: new Date(), // ini manual // kalo nanti mau otomatis pake | new Date |
                        discount_amount: 0,
                        total_amount: item.unit_price * item.quantity,
                        payment_method: item.trx_method || "CASH",
                        subtotal_amount: 0
                    }
                })
                res.push(trx)
                await tx.transactionItems.create({
                    data:{
                        transaction_id: trx.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        line_price: item.unit_price * item.quantity
                    }
                })

                let delta = 0
                if (item.trx_type === TrxTypeEnum.SALE) delta = -item.quantity
                if (item.trx_type === TrxTypeEnum.PURCHASE) delta = item.quantity
                if (item.trx_type === TrxTypeEnum.ADJUSTMENT) delta = item.quantity

                await tx.stocks.updateMany({
                    where: {
                        product_id: item.product_id,
                        deleted_at: null
                    },
                    data: {
                        stock_on_hand: {
                            increment: delta
                        }
                    }
                })
            }

            await tx.aiRuns.create({
                data: {
                    business_id: businessId,
                    status: 'PROCESSING',
                    generated_at: new Date(),
                    error_message: ''
                }
            })
        })

        return res
    }

    public async getTransactionsWithItems(from: Date, to: Date, type: TrxTypeEnum) {
        return await prisma.transactions.findMany({
            where: {
                deleted_at: null,
                trx_date: {
                    gte: from,
                    lte: to
                },
                trx_type: type
            },
            include: {
                transaction_items: {
                    where: {
                        deleted_at: null
                    }
                }
            },
            orderBy: {
                trx_date: 'desc'
            }
        })
    }

    public async softDeleteAndRollback(transactionId: string) {
        let res : Transactions = {} as Transactions
        await prisma.$transaction(async (tx) => {
            const trx = await tx.transactions.findFirstOrThrow({
                where: {
                    id: transactionId,
                    deleted_at: null
                },
                include: {
                    transaction_items: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            })

            res = trx

            await tx.transactions.update({
                where: {
                    id: transactionId,
                    deleted_at: null
                },
                data: {
                    deleted_at: new Date()
                }
            })

            await tx.transactionItems.updateMany({
                where: {
                    transaction_id: transactionId,
                    deleted_at: null
                },
                data: {
                    deleted_at: new Date()
                }
            })

            for (const item of trx.transaction_items) {
                let rollback = 0
                if (trx.trx_type === "SALE") rollback = item.quantity
                if (trx.trx_type === "PURCHASE") rollback = -item.quantity
                if (trx.trx_type === "ADJUSTMENT") rollback = -item.quantity


                await tx.stocks.updateMany({
                    where: {
                        product_id: item.product_id,
                        deleted_at: null
                    },
                    data: {
                        stock_on_hand: {
                            increment: rollback
                        }
                    }
                })

                await tx.aiRuns.create({
                    data: {
                        business_id: trx.business_id,
                        status: 'PROCESSING',
                        generated_at: new Date(),
                        error_message: ''
                    }
                })
            }
        })
    }
}