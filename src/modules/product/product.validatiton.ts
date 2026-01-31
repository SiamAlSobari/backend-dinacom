import z from "zod";

export const createProductValidation = z.object({
    image: z
        .instanceof(File)
        .refine(
            (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
            { message: "File harus berupa gambar" }
        ),
    name: z.string().min(3),
    unit: z.enum(["PCS", "KG", "LITER", "BOX", "PACK"]),
    stock: z.coerce.number(),
    price: z.coerce.number().min(0),
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
    stock: z.coerce.number().optional(),
});

export const updateProductParamValidation = z.object({
    productId: z.string().uuid(),
});
