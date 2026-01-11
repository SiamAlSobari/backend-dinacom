import { normalizeMonthWeeks, normalizeWeekData } from "../../common/utils/analytic.js";
import type { AnalyticRepository } from "./analytic.repository.js";

export class AnalyticService {
    constructor(
        private readonly analyticRepository: AnalyticRepository
    ) { }

    public async getWeeklySales(businessId: string) {
        const data = await this.analyticRepository.soldPerDayThisWeek(businessId)
        return normalizeWeekData(data)
    }

    public async getMonthlySales(businessId: string) {
        const data = await this.analyticRepository.soldPerWeekThisMonth(businessId)
        return normalizeMonthWeeks(data)
    }

    public async getTopProductThisWeek(businessId: string) {
        return this.analyticRepository.topProductThisWeek(businessId, 5)
    }

    public async getTopProductThisMonth(businessId: string) {
        return this.analyticRepository.topProductThisMonth(businessId, 5)
    }
}