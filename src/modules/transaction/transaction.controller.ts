import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { BulkTransactionValidation, DeleteTransactionValidation, TransactionQueryValidation } from "./transaction.validation.js";
import { TransactionRepository } from "./transaction.repository.js";
import { TransactionService } from "./transaction.service.js";
import type { TrxTypeEnum } from "../../common/enums/transaction.js";
import { HttpResponse } from "../../common/utils/response.js";


// Instansi class
const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(transactionRepository);


export const transactionController = new Hono()
    .post(
        "/bulk",
        authMiddleware,
        sValidator('json', BulkTransactionValidation),
        async (c) => {
            const { business_id, items, trx_date, trx_type } = c.req.valid('json')
            const trxDate = new Date(`${trx_date}T00:00:00.000Z`)
            const transaction = await transactionService.createTransactionWithBulk(business_id, trx_type as TrxTypeEnum, trxDate, items)
            return HttpResponse(c, "Berhasil membuat transaksi", 201, transaction, null)
        }
    )
    .get(
        "/",
        authMiddleware,
        sValidator('query', TransactionQueryValidation),
        async (c) => {
            const { type, from, to } = c.req.valid('query')
            const transactions = await transactionService.getTransactions(new Date(to  + "T23:59:59.999Z"), new Date(from + "T00:00:00.000Z"), type as TrxTypeEnum)
            return HttpResponse(c, "Berhasil mendapatkan transaksi", 200, transactions, null)
        }
    )
    .delete(
        '/:transactionId',
        authMiddleware,
        sValidator('param', DeleteTransactionValidation),
        async (c) => {
            const { transactionId } = c.req.valid('param')
            const deleteTransaction = await transactionService.deleteTransaction(transactionId)
            return HttpResponse(c, "Berhasil mengahus transaksi", 200, deleteTransaction, null)
        }
    )