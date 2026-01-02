import { z } from "zod";

export const SubscribeValidation = z.object({
  plan_duration: z.enum([
    "MONTHLY_1",
    "MONTHLY_2",
    "MONTHLY_3",
  ]),
});


export const MidtransWebhookValidation = z.object({
  order_id: z.string(),
  transaction_status: z.enum([
    "pending",
    "capture",
    "settlement",
    "deny",
    "cancel",
    "expire",
    "refund",
  ]),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  payment_type: z.string().optional(),
  transaction_time: z.string().optional(),
})