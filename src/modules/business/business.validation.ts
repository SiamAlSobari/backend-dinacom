import z from "zod";

export const businessValidation ={
    create: z.object({
        name: z.string().min(3)
    }),
    delete: z.object({
        businessId: z.string()
    })
}