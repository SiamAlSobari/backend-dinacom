import { prisma } from "../../common/utils/db.js";

export class BillingRepository {
    public async getActiveSubscription(userId: string) {
        return await prisma.subscriptions.findFirst({
            where: {
                user_id: userId,
                status: "ACTIVE",
                deleted_at: null,
            },
            orderBy: { created_at: "desc" },
        });
    }

    public async createSubscription(userId: string, duration: any, start: Date, end: Date) {
        return await prisma.subscriptions.create({
            data: {
                user_id: userId,
                plan_duration: duration,
                start_date: start,
                end_date: end,
                status: "PENDING",
            },
        });
    }

    public async createPayment(data: {
        user_id: string;
        subscription_id: string;
        order_id: string;
        amount: number;
    }) {
        return await prisma.payments.create({
            data: {
                user_id: data.user_id,
                subscription_id: data.subscription_id,
                order_id: data.order_id,
                gross_amount: data.amount,
                status: "PENDING",
            },
        });
    }


    public async getPaymentByOrderId(orderId: string) {
        return await prisma.payments.findFirst({
            where: {
                order_id: orderId,
                deleted_at: null
            },
            include: {
                subscription: true
            }
        });
    }

    public async expireSubscriptions(userId: string) {
        const result = await prisma.subscriptions.updateMany({
            where: {
                status: 'ACTIVE',
                end_date: { lt: new Date() },
                user_id: userId
            },
            data: { status: 'EXPIRED' },
        });

        if (result.count > 0) {
            console.log(`Auto-expired ${result.count} subscription(s)`);
        }
    }

}