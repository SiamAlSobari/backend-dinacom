import { z } from "zod";

export const SetStockValidation = z.object({
    businessId: z.string().uuid(),
    items: z.array(
        z.object({
            product_id: z.string().uuid(),
            stock: z.number().int()
        })
    ).min(1)
});

export const DeleteStockValidation = z.object({
    stockId: z.string().uuid(),
});

export const GetStockValidation = z.object({
    businessId: z.string().uuid(),
});
