import { snap } from "../../common/utils/midtrans.js";
import type { BillingRepository } from "./billing.repository.js";
import { addMonths } from "date-fns";



const PRICE_MAP = {
    MONTHLY_1: 100000,
    MONTHLY_2: 180000,
    MONTHLY_3: 250000,
};

export class BillingService {
    constructor(
        private readonly billingRepository: BillingRepository
    ) { }


    public async getSubscription(userId: string) {
        return await this.billingRepository.getActiveSubscription(userId)
    }

    public async subscribe(userId: string, plan: keyof typeof PRICE_MAP) {
        const start = new Date();
        const end = addMonths(start, Number(plan.split("_")[1]));

        const subscription = await this.billingRepository.createSubscription(userId, plan, start, end)
        const orderId = `ORD-${Date.now()}`;
        const amount = PRICE_MAP[plan];

        const snapTx = await snap.createTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },

        })

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