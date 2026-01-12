import type { ActivityRepository } from "./activity.repository.js";

export class ActivityService {
    constructor(
        private readonly activityRepository: ActivityRepository
    ) {}

    public async getActivities(businessId: string, limit ?: number) {
        return await this.activityRepository.getActivities(businessId, limit);
    }
}