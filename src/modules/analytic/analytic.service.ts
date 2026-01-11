import { normalizeWeekData } from "../../common/utils/analytic.js";
import type { AnalyticRepository } from "./analytic.repository.js";

export class AnalyticService {
    constructor(
        private readonly analyticRepository: AnalyticRepository
    ) {}

    public async getWeeklySales(businessId: string) {
        const data = await this.analyticRepository.soldPerDayThisWeek(businessId)
        return normalizeWeekData(data)
    }
}