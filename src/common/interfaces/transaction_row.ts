import type { TrxType } from "../../../generated/prisma/enums.js";

export interface TransactionRow {
    product_id: string;
    quantity: number;
    transaction: { trx_date: Date; trx_type: TrxType };
}