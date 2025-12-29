import { Hono } from "hono";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { sValidator } from "@hono/standard-validator";
import { businessValidation } from "./business.validation.js";
import { BusinessRepository } from "./business.repository.js";
import { BusinessService } from "./business.service.js";
import { HttpResponse } from "../../common/utils/response.js";


// Instalsi classs business
const businessRepository = new BusinessRepository()
const businessService = new BusinessService(businessRepository)


export const businessController = new Hono()
    .post(
        "/",
        authMiddleware,
        sValidator("json", businessValidation.create),
        async (c) => {
            const { name } = c.req.valid('json')
            const user = c.get('user')
            const business = await businessService.createBusiness(user.id, name)
            return HttpResponse(c, "Berhasil membuat business", 201, business, null)
        }
    )
    .delete(
        '/:businessId',
        authMiddleware,
        sValidator('param', businessValidation.delete),
        async (c) => {
            const { businessId } = c.req.valid('param')
            const user = c.get('user')
            const business = await businessService.delete(user.id,businessId)
            return HttpResponse(c, "Berhasil mengahus business", 200, business, null)
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
