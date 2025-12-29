import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import { jwtSeccret } from "../utils/env.js";
import { HTTPException } from "hono/http-exception";

declare module "hono" {
    interface ContextVariableMap {
        user: { id: string; email: string; };
    }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const token = await getCookie(c, "token");
    if (!token) throw new HTTPException(401);
    const payload = await verify(token, jwtSeccret);
    if (!payload) throw new HTTPException(401);
    c.set("user", payload as { id: string; email: string});
    await next();
};