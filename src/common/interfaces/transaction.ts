export interface TransactionItem {
    product_id: string;
    quantity: number;
}

export interface Transaction {
    business_id: string;
    trx_type: string;
    trx_date: Date;
    items: TransactionItem[];
}

export interface TransactionQuery {
    from: Date;
    to: Date;
    type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT';
}