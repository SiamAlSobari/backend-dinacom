import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { BusinessRepository } from "./business.repository.js";
import { BusinessService } from "./business.service.js";
import { HttpResponse } from "../../common/utils/response.js";
import { createBusinessValidation, deleteBusinessValidation } from "./business.validation.js";


// Instalsi classs business
const businessRepository = new BusinessRepository()
const businessService = new BusinessService(businessRepository)


export const businessController = new Hono()
    .post(
        "/",
        authMiddleware,
        sValidator("json", createBusinessValidation),
        async (c) => {
            const { name } = c.req.valid('json')
            const user = c.get('user')
            const business = await businessService.createBusiness(user.id, name)
            return HttpResponse(c, "Berhasil membuat business", 201, business, null)
        }
    )
    .delete(
        '/',
        authMiddleware,
        sValidator('param', deleteBusinessValidation),
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id);
            if (!business) {
                return HttpResponse(c, "business not found", 404, null, null);
            }
            await businessService.delete(user.id,business.id)
            return HttpResponse(c, "Berhasil mengahus business", 200, null, null)
        }
    )
    .get(
        '/',
        async (c) => {
            const user = c.get('user')
            const business = await businessService.getBusiness(user.id)
            return HttpResponse(c, "Berhasil mengahus business", 200, business, null)
        }
    )
