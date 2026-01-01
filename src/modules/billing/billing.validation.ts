// src/billing/billing.validation.ts
import { z } from "zod";

export const SubscribeValidation = z.object({
  plan_duration: z.enum([
    "MONTHLY_1",
    "MONTHLY_2",
    "MONTHLY_3",
  ]),
});
