import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import { HttpException } from "../utils/error.js";
import { jwtSeccret } from "../utils/env.js";

declare module "hono" {
    interface ContextVariableMap {
        user: { id: string; email: string; role: string };
    }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const token = await getCookie(c, "token");
    if (!token) throw new HttpException("Unauthorized", 401);
    const payload = await verify(token, jwtSeccret);
    if (!payload) throw new HttpException("Unauthorized", 401);
    c.set("user", payload as { id: string; email: string; role: string });
    await next();
};