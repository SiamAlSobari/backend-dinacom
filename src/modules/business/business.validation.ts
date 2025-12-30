import z from "zod";

export const createBusinessValidation = z.object({
  name: z.string().min(3),
});

export const deleteBusinessValidation = z.object({
  businessId: z.string(),
});
