import { hash, verify } from "argon2";

export const hashPassword = async (password: string): Promise<string> => {
   return await hash(password);
};

export const comparePassword = async (password: string, hashPassword: string): Promise<boolean> => {
   return await verify(password, hashPassword);
};