import type { RevenueTrend } from "../../common/interfaces/analytic.js";
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

    async getMonthlyWeeklyTrend(businessId: string): Promise<RevenueTrend[]> {
        const now = new Date()

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const transactions = await this.analyticRepository.findMonthlyRevenue(
            businessId,
            startOfMonth,
            endOfMonth
        )

        // Siapkan week bucket (1–5)
        const weeklyRevenue: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        }

        for (const trx of transactions) {
            const day = trx.trx_date.getDate() // 1–31
            const week = Math.ceil(day / 7) // 1–5
            weeklyRevenue[week] += trx.total_amount
        }

        // Hitung jumlah week di bulan ini
        const daysInMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate()

        const totalWeeks = Math.ceil(daysInMonth / 7)

        const result: RevenueTrend[] = []

        for (let i = 1; i <= totalWeeks; i++) {
            result.push({
                week: `Week ${i}`,
                revenue: weeklyRevenue[i] || 0,
            })
        }

        return result
    }


     async getStableUnstableWeekly(businessId: string) {
    const now = new Date()

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const rows = await this.analyticRepository.findMonthlySalesWithStock(
      businessId,
      startOfMonth,
      endOfMonth
    )

    // 🔹 cari Senin awal minggu kalender
    const start = new Date(startOfMonth)
    const day = start.getDay() // 0 Minggu - 6 Sabtu
    const diffToMonday = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diffToMonday)

    // 🔹 generate week range yang kena bulan ini
    const weeks: {
      label: string
      start: Date
      end: Date
      stable: number
      unstable: number
    }[] = []

    let cursor = new Date(start)
    let index = 1

    while (cursor <= endOfMonth) {
      const ws = new Date(cursor)
      const we = new Date(cursor)
      we.setDate(we.getDate() + 6)
      we.setHours(23, 59, 59, 999)

      if (we >= startOfMonth && ws <= endOfMonth) {
        weeks.push({
          label: `Week ${index}`,
          start: ws,
          end: we,
          stable: 0,
          unstable: 0,
        })
        index++
      }

      cursor.setDate(cursor.getDate() + 7)
    }

    // 🔹 mapping data ke week + klasifikasi stable / unstable
    for (const row of rows) {
      const trxDate = row.transaction.trx_date

      const week = weeks.find(
        (w) => trxDate >= w.start && trxDate <= w.end
      )
      if (!week) continue

      const stock =
        row.product.stocks.reduce((a, b) => a + b.stock_on_hand, 0) || 0

      if (stock >= row.quantity) {
        week.stable += row.quantity
      } else {
        week.unstable += row.quantity
      }
    }

    return weeks.map((w) => ({
      week: w.label,
      stable: w.stable,
      unstable: w.unstable,
    }))
  }
}