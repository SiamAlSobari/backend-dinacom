import z from "zod";

export const authValidation = {
    register: z.object({
        name: z.string({ message: "Nama wajib di isi" }).min(3, { message: "Minimal 3 karakter" }),
        email: z.email(),
        password: z.string({ message: "Password wajib di isi" }).min(6, { message: 'Minimal 6 karakter' }),
    }),
    
    login: z.object({
        email: z.email(),
        password: z.string({ message: "Password wajib di isi" }).min(6, { message: 'Minimal 6 karakter' }),
    }),
}