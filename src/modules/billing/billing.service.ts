import { snap } from "../../common/utils/midtrans.js";
import type { BillingRepository } from "./billing.repository.js";
import { SubscriptionDuration } from "../../../generated/prisma/enums.js";
import { PRICE_MAP } from "../../common/constants/billing.js";
import { calcEndDate } from "../../common/utils/billing.js";

export class BillingService {
    constructor(private readonly billingRepository: BillingRepository) { }

    async getSubscription(userId: string) {
        await this.billingRepository.expireSubscriptions(userId);
        return this.billingRepository.getActiveSubscription(userId);
    }

    async subscribe(userId: string, plan: SubscriptionDuration) {
        const subscription = await this.billingRepository.createSubscription(
            userId,
            plan,
            new Date(),
            calcEndDate(plan)
        );

        const orderId = `ORD-${Date.now()}`;
        const amount = PRICE_MAP[plan];

        const snapTx = await snap.createTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
        });

        await this.billingRepository.createPayment({
            user_id: userId,
            subscription_id: subscription.id,
            order_id: orderId,
            amount,
        });

        return {
            snap_token: snapTx.token,
            redirect_url: snapTx.redirect_url,
        };
    }
}
