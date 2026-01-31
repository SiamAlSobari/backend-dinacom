import { Hono } from "hono";
import { ActivityRepository } from "./activity.repository.js";
import { ActivityService } from "./activity.service.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { BusinessRepository } from "../business/business.repository.js";
import { HttpResponse } from "../../common/utils/response.js";

const  activityRepository = new ActivityRepository();
const businessRepository = new BusinessRepository();
const activityService = new ActivityService(activityRepository);

export const activityController = new Hono()
    .get(
        "/", 
        authMiddleware,
        async (c) => {
        const user = c.get('user')
        const business= await businessRepository.get(user.id);
        if (!business) {
            return HttpResponse(c, "business not found", 404, null, null);
        }
        const activities =  await activityService.getActivities(business.id, 5);
        return HttpResponse(c, "Activities retrieved successfully", 200, activities, null);
    })
    .get(
        "/all", 
        authMiddleware,
        async (c) => {
        const user = c.get('user')
        const business= await businessRepository.get(user.id);
        if (!business) {
            return HttpResponse(c, "business not found", 404, null, null);
        }
        const activities =  await activityService.getActivities(business.id);
        return HttpResponse(c, "All activities retrieved successfully", 200, activities, null);
    }
    )