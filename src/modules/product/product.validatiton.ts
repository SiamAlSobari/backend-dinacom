import z from "zod";

export const createProductValidation = z.object({
    image: z
        .instanceof(File)
        .refine(
            (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
            { message: "File harus berupa gambar" }
        ),
    business_id: z.string(),
    name: z.string().min(3),
    unit: z.enum(["PCS", "KG", "LITER", "BOX", "PACK"]),
    stock: z.coerce.number(),
});

export const deleteProductValidation = z.object({
    productId: z.string(),
});

export const getProductsValidation = z.object({
    search: z.string().optional(),
});

export const getProductPerBusinessValidation = z.object({
    businessId: z.string(),
});

export const updateProductValidation = z.object({
    image: z
        .instanceof(File)
        .refine(
            (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
            { message: "File harus berupa gambar" }
        )
        .optional(),
    name: z.string().min(3),
    unit: z.enum(["PCS", "KG", "LITER", "BOX", "PACK"]),
});

export const updateProductParamValidation = z.object({
    productId: z.string().uuid(),
});
