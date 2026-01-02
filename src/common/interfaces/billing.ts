export interface MidtransWebhookPayload {
  order_id: string;
  transaction_status: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  payment_type?: string;
  transaction_time?: string;
}
