import { sign } from "hono/jwt";

export const generateToken = async (payload: object, secret: string) => {
    const token = await sign(
        {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 2, // 2hari
        },
        secret
    );
    return token;
};