import type { TrxTypeEnum } from "../../common/enums/transaction.js";
import { prisma } from "../../common/utils/db.js";

export class TransactionRepository {
    // public async createBulk(businessId: string, trxType: string, trxDate: Date) {
    //     return await prisma.$transaction(async (tx) => {

    //     })
    // }

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
}