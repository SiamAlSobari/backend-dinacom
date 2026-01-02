import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { MidtransWebhookValidation, SubscribeValidation } from "./billing.validation.js";
import { BillingRepository } from "./billing.repository.js";
import { BillingService } from "./billing.service.js";
import { HttpResponse } from "../../common/utils/response.js";
import { BillingWebhookHandler } from "./billing.webhook.js";

const billingRepository = new BillingRepository()
const billingService = new BillingService(billingRepository)
const billingWebhookHandler = new BillingWebhookHandler(billingRepository)
export const billingController = new Hono()
    .post(
        '/subscribe',
        authMiddleware,
        sValidator('json', SubscribeValidation),
        async (c) => {
            const { plan_duration } = c.req.valid('json')
            const user = c.get('user')
            const subscribe = await billingService.subscribe(user.id, plan_duration)
            return HttpResponse(c, "Berhasil subscribe", 201, subscribe, null)
        }
    )
    .get(
        '/subscription',
        authMiddleware,
        async (c) => {
            const user = c.get('user')
            const subscription = await billingService.getSubscription(user.id)
            return HttpResponse(c, "Berhasil mendapatkan subscription", 200, subscription, null)
        }
    )
    .post(
        '/webhook',
        authMiddleware,
        sValidator('json', MidtransWebhookValidation),
        async (c) => {
            const payload = await c.req.json();
            await billingWebhookHandler.handle(payload);
            return HttpResponse(c, "Berhasil mendapatkan subscription", 200, null, null)
        }
    )