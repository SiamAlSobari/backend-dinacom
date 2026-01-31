import { HTTPException } from "hono/http-exception";
import { prisma } from "../../common/utils/db.js";

import type { BillingRepository } from "./billing.repository.js";
import { calcEndDate, mapPaymentStatus, verifyMidtransSignature } from "../../common/utils/billing.js";
import type { MidtransWebhookPayload } from "../../common/interfaces/billing.js";
import { SUCCESS_TRANSACTION_STATUS } from "../../common/constants/billing.js";

export class BillingWebhookHandler {
    constructor(private readonly billingRepository: BillingRepository) { }

    public async handle(payload: MidtransWebhookPayload) {
        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            payment_type,
            transaction_time,
        } = payload;
        console.log("Received Midtrans webhook:", payload);

        // const valid = verifyMidtransSignature(
        //   order_id,
        //   status_code,
        //   gross_amount,
        //   signature_key
        // );

        // if (!valid) {
        //   throw new HTTPException(400, { message: "Invalid signature" });
        // }

        const payment = await this.billingRepository.getPaymentByOrderId(order_id);
        if (!payment) {
            throw new HTTPException(404, { message: "Payment not found" });
        }

        if (payment.status === "SETTLEMENT") return;

        const newStatus = mapPaymentStatus(transaction_status);

        await prisma.$transaction(async (tx) => {
            await tx.payments.update({
                where: { id: payment.id },
                data: {
                    status: newStatus,
                    payment_type,
                    transaction_time: transaction_time
                        ? new Date(transaction_time)
                        : null,
                },
            });

            if (
                SUCCESS_TRANSACTION_STATUS.includes(transaction_status as any) &&
                payment.subscription.status !== "ACTIVE"
            ) {
                await tx.subscriptions.update({
                    where: { id: payment.subscription.id },
                    data: {
                        status: "ACTIVE",
                        start_date: new Date(),
                        end_date: calcEndDate(payment.subscription.plan_duration),
                    },
                });
            }
        });
    }
}
