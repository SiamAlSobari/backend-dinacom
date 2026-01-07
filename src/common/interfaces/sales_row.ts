export interface SalesRow {
    product_id: string;
    quantity: number;
    transaction: { trx_date: Date };
}