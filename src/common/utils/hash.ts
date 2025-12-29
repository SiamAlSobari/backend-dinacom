import { hash, verify } from "argon2";

export const hashPassword = async (password: string): Promise<string> => {
   return await hash(password);
};

export const comparePassword = async (
   plainPassword: string,
   hashedPassword: string
): Promise<boolean> => {
   return verify(hashedPassword, plainPassword);
};