import type { TrxTypeActivity } from "../../../generated/prisma/enums.js";
import { prisma } from "../../common/utils/db.js";

export class ActivityRepository {
    public async createActivity(businessId: string, activityText: string, trxType?: TrxTypeActivity) {
        return await prisma.activity.create({
            data: {
                business_id: businessId,
                activity_text: activityText,
                trx_type: trxType
            }
        })
    }
}