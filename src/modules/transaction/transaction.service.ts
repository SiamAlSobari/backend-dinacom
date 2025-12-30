import { TrxTypeEnum } from "../../common/enums/transaction.js";
import type { TransactionItem } from "../../common/interfaces/transaction.js";
import { prisma } from "../../common/utils/db.js";
import type { TransactionRepository } from "./transaction.repository.js";

export class TransactionService {
    constructor(
        private readonly transactionRepository: TransactionRepository
    ) { }

    public async createTransactionWithBulk(businessId: string,trxType: TrxTypeEnum, trxDate: Date, items: TransactionItem[]) {
        const result = await prisma.$transaction(async (tx) => {
            const trx = await tx.transactions.create({
                data: {
                    business_id: businessId,
                    trx_type: trxType,
                    trx_date: trxDate
                }
            })

            for (const item of items) {
                await tx.transactionItems.create({
                    data: {
                        transaction_id: trx.id,
                        product_id: item.product_id,
                        quantity: item.quantity
                    }
                })

                let delta = 0
                if (trxType === TrxTypeEnum.SALE) delta = -item.quantity
                if (trxType === TrxTypeEnum.PURCHASE) delta = item.quantity
                if (trxType === TrxTypeEnum.ADJUSTMENT) delta = item.quantity

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
    }

    public async getTransactions(to: Date, from: Date, type: TrxTypeEnum) {
        return await this.transactionRepository.getTransactionsWithItems(from, to, type)
    }
}