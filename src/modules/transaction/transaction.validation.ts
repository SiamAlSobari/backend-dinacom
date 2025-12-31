import { z } from "zod"
import { TrxTypeEnum } from "../../common/enums/transaction.js";

export const TransactionItemValidation = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export const BulkTransactionValidation = z.object({
  business_id: z.string().uuid(),
  trx_type: z.enum(["SALE", "PURCHASE", "ADJUSTMENT"]),
  trx_date: z.string().datetime(),
  items: z.array(TransactionItemValidation).min(1),
})

export const TransactionQueryValidation = z.object({
  type: z.nativeEnum(TrxTypeEnum).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})


export const DeleteTransactionValidation = z.object({
  transactionId: z.string().uuid(),
})