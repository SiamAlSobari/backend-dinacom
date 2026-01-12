import { TrxTypeEnum } from "../../common/enums/transaction.js";
import type { TransactionItem } from "../../common/interfaces/transaction.js";
import { prisma } from "../../common/utils/db.js";
import { ActivityRepository } from "../activity/activity.repository.js";
import type { TransactionRepository } from "./transaction.repository.js";
import type { TransactionItemType } from "./transaction.validation.js";

export class TransactionService extends ActivityRepository {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly activityRepository: ActivityRepository
    ) { super() }

    public async createTransactionWithBulk(businessId: string, items: TransactionItemType[]) {
        const trx = await this.transactionRepository.createBulk(businessId, items)
        return trx
    }

    public async getTransactions(to: Date, from: Date, type: TrxTypeEnum) {
        return await this.transactionRepository.getTransactionsWithItems(from, to, type)
    }

    public async deleteTransaction(transactionId: string) {
        const trx = await this.transactionRepository.softDeleteAndRollback(transactionId)
        return trx
    }
}