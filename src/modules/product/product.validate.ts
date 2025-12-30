import z from "zod";

export const productValidation = {
    create: z.object({
        image: z.instanceof(File).refine((file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type), {
            message: "File harus berupa gambar"
        }),
        business_id: z.string(),
        name: z.string().min(3),
        unit: z.enum(["PCS","KG","LITER", "BOX", "PACK"]),
        stock: z.coerce.number(),
    }),
    delete: z.object({
        productId: z.string()
    }),
    getProducts: z.object({
        search: z.string().optional(),
    }),
    getProductPerBusiness: z.object({
        businessId: z.string(),
    }),
    update: z.object({
        productId: z.string(),
        image: z.instanceof(File).refine((file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type), {
            message: "File harus berupa gambar"
        }).optional(),
        name: z.string().min(3),
        unit: z.enum(["PCS","KG","LITER", "BOX", "PACK"]),
    }),
    updateParam: z.object({
        productId: z.string(),
    }),
}