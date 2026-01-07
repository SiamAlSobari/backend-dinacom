import z from "zod";


const WIB_OFFSET = "+07:00";

export const IndonesiaDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .transform((dateStr) => {
        const d = new Date(`${dateStr}T00:00:00${WIB_OFFSET}`);
        if (Number.isNaN(d.getTime())) {
            throw new Error("Invalid date");
        }
        return d;
    });

export  const AiRangeValidation = z
    .object({
        business_id: z.string().min(1),
        from: IndonesiaDateSchema,
        to: IndonesiaDateSchema,
    })
    .refine((v) => v.from <= v.to, {
        message: "`from` must be <= `to`",
        path: ["from"],
    });