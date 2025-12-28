import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";

export const guestMiddleware: MiddlewareHandler = async (c, next) => {
    const token = await getCookie(c, "token");
    if (token) {
        return c.json({
            message: "Anda sudah login",
        }, 400)
    }
    return next();
};