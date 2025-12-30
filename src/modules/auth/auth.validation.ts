import z from "zod";

export const registerAuthValidation = z.object({
  name: z
    .string({ message: "Nama wajib di isi" })
    .min(3, { message: "Minimal 3 karakter" }),
  email: z.email(),
  password: z
    .string({ message: "Password wajib di isi" })
    .min(6, { message: "Minimal 6 karakter" }),
});

export const loginAuthValidation = z.object({
  email: z.email(),
  password: z
    .string({ message: "Password wajib di isi" })
    .min(6, { message: "Minimal 6 karakter" }),
});
