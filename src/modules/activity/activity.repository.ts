import type { ActivityType } from "../../../generated/prisma/enums.js";
import { prisma } from "../../common/utils/db.js";

export class ActivityRepository {
    public async createActivity(businessId: string, activityText: string, activityType: ActivityType) {
        return await prisma.activity.create({
            data: {
                business_id: businessId,
                activity_text: activityText,
                activity_type: activityType
            }
        })
    }

    public async getActivities(businessId: string, limit ?: number) {
        return await prisma.activity.findMany({
            where: {
                business_id: businessId
            },
            take: limit
        });
    }
}