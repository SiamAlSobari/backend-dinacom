export interface TransactionItem {
    product_id: string;
    quantity: number;
    trx_type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT';
    trx_date: Date;
    unit_price: number;
    status: "SUCCESS" | "PENDING" | "FAILED";
    trx_method: "CASH" | "CREDIT" | "DEBIT";

}

export interface Transaction {
    business_id: string;
    items: TransactionItem[];
}

export interface TransactionQuery {
    from: Date;
    to: Date;
    type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT';
}