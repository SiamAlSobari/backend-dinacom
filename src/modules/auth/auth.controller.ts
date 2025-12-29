import { Hono } from "hono";
import type { Context } from "hono/jsx";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { authValidation } from "./auth.validation.js";
import { UserRepository } from "../user/user.repository.js";
import { AuthService } from "./auth.service.js";
import { HttpResponse } from "../../common/utils/response.js";
import { setCookie } from "hono/cookie";
import { guestMiddleware } from "../../common/middlewares/guest.middleware.js";

// Instansi class
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

export const authController = new Hono()
    .post(
        "/register",
        guestMiddleware,
        sValidator("json", authValidation.register),
        async (c) => {
            const { email, name, password } = c.req.valid("json");
            const user = await authService.register(name, email, password);
            return HttpResponse(c, "Register berhasil", 201, user.id, null);
        }
    )
    .post(
        "/login",
        guestMiddleware,
        sValidator("json", authValidation.login),
        async (c) => {
            const { email, password } = c.req.valid("json");
            const user = await authService.login(email, password);
            setCookie(c, "token", user, { path: "/", maxAge: 60 * 60 * 24 * 2 });
            return HttpResponse(c, "Login berhasil", 200, { token: user }, null);
        }
    )
    .get("/session", authMiddleware, async (c) => {
        const user = c.get("user");
        return HttpResponse(c,"Session anda berhasil", 200, {user}, null)
    });
