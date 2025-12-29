import { Hono } from "hono";
import type { Context } from "hono/jsx";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";

export const authController = new Hono()
    .post('/register')
    .get("/session", authMiddleware, async (c) => {
        const user = c.get("user");
    })