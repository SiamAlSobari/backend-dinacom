import { Prisma, type Transactions } from "../../../generated/prisma/client.js";
import { TrxTypeEnum } from "../../common/enums/transaction.js";
import type { TransactionItem } from "../../common/interfaces/transaction.js";
import { prisma } from "../../common/utils/db.js";
import type { TransactionItemType } from "./transaction.validation.js";

type Period = 'week' | 'month'


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
                    data: {
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
        let res: Transactions = {} as Transactions
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


    public async soldTotals(businessId: string) {
        return await prisma.transactionItems.groupBy({
            by: ['product_id'],
            where: {
                deleted_at: null,
                transaction: {
                    trx_type: 'SALE',
                    deleted_at: null,
                    business_id: businessId,
                },
            },
            _sum: {
                quantity: true,
            },
        })
    }

    public async topProductsSelling(businessId: string, limit: number) {
        const topProducts = await prisma.transactionItems.groupBy({
            by: ['product_id'],
            where: {
                deleted_at: null,
                transaction: {
                    trx_type: 'SALE',
                    deleted_at: null,
                    business_id: businessId,
                },
            },
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: limit, // top 5
        })
        return topProducts
    }

    public async soldPerWeek(businessId: string) {
        const soldPerWeek = await prisma.$queryRaw<
            {
                product_id: string
                week: Date
                total_sold: number
            }[]
        >`
    SELECT 
      ti.product_id,
      date_trunc('week', t.trx_date) AS week,
      SUM(ti.quantity)::int AS total_sold
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE 
      t.trx_type = 'SALE'
      AND t.deleted_at IS NULL
      AND ti.deleted_at IS NULL
      AND t.business_id = ${businessId}
    GROUP BY ti.product_id, week
    ORDER BY week ASC
  `

        return soldPerWeek
    }

//     public async topSellingPerWeek(businessId: string) {
//         const result = await prisma.$queryRaw<
//             {
//                 week: Date
//                 product_id: string
//                 product_name: string
//                 price: number
//                 total_sold: number
//             }[]
//         >`
//     SELECT 
//       week,
//       product_id,
//       product_name,
//       price,
//       total_sold
//     FROM (
//       SELECT 
//         date_trunc('week', t.trx_date) AS week,
//         p.id AS product_id,
//         p.name AS product_name,
//         p.price,
//         SUM(ti.quantity)::int AS total_sold,
//         ROW_NUMBER() OVER (
//           PARTITION BY date_trunc('week', t.trx_date)
//           ORDER BY SUM(ti.quantity) DESC
//         ) AS rn
//       FROM transaction_items ti
//       JOIN transactions t ON t.id = ti.transaction_id
//       JOIN products p ON p.id = ti.product_id
//       WHERE 
//         t.trx_type = 'SALE'
//         AND t.deleted_at IS NULL
//         AND ti.deleted_at IS NULL
//         AND p.deleted_at IS NULL
//         AND t.business_id = ${businessId}
//       GROUP BY week, p.id, p.name, p.price
//     ) ranked
//     WHERE rn = 1
//     ORDER BY week ASC
//   `
//         return result
//     }




//     public async topSellingByPeriod(
//         businessId: string,
//         period: 'week' | 'month' = 'week',
//         limit: number = 1
//     ) {
//         const trunc =
//             period === 'month'
//                 ? Prisma.sql`'month'`
//                 : Prisma.sql`'week'`

//         const result = await prisma.$queryRaw<
//             {
//                 period: Date
//                 product_id: string
//                 product_name: string
//                 price: number
//                 total_sold: number
//                 rank: number
//             }[]
//         >(Prisma.sql`
//     SELECT period, product_id, product_name, price, total_sold, rn AS rank
//     FROM (
//       SELECT 
//         date_trunc(${trunc}, t.trx_date) AS period,
//         p.id AS product_id,
//         p.name AS product_name,
//         p.price,
//         SUM(ti.quantity)::int AS total_sold,
//         ROW_NUMBER() OVER (
//           PARTITION BY date_trunc(${trunc}, t.trx_date)
//           ORDER BY SUM(ti.quantity) DESC
//         ) AS rn
//       FROM transaction_items ti
//       JOIN transactions t ON t.id = ti.transaction_id
//       JOIN products p ON p.id = ti.product_id
//       WHERE 
//         t.trx_type = 'SALE'
//         AND t.deleted_at IS NULL
//         AND ti.deleted_at IS NULL
//         AND p.deleted_at IS NULL
//         AND t.business_id = ${businessId}
//       GROUP BY 
//         date_trunc(${trunc}, t.trx_date),
//         p.id, p.name, p.price
//     ) ranked
//     WHERE rn <= ${limit}
//     ORDER BY period ASC, rn ASC
//   `)

//         return result
//     }



}