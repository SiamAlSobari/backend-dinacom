import { Prisma } from "../../../generated/prisma/client.js"
import { prisma } from "../../common/utils/db.js"

export class AnalyticRepository {
  public async soldPerDayThisWeek(businessId: string) {
    const result = await prisma.$queryRaw<
      {
        day: number
        day_name: string
        total_sold: number
      }[]
    >(Prisma.sql`
    SELECT
      EXTRACT(DOW FROM t.trx_date)::int AS day,
      TO_CHAR(t.trx_date, 'Day') AS day_name,
      COALESCE(SUM(ti.quantity), 0)::int AS total_sold
    FROM transactions t
    JOIN transaction_items ti ON ti.transaction_id = t.id
    WHERE
      t.trx_type = 'SALE'
      AND t.deleted_at IS NULL
      AND ti.deleted_at IS NULL
      AND t.business_id = ${businessId}
      AND t.trx_date >= date_trunc('week', now())
      AND t.trx_date < date_trunc('week', now()) + interval '7 day'
    GROUP BY day, day_name
    ORDER BY day ASC
  `)

    return result
  }

  public async soldPerWeekThisMonth(businessId: string) {
    const result = await prisma.$queryRaw<
      { week: number; total_sold: number }[]
    >(Prisma.sql`
      SELECT
        FLOOR(
          (DATE(t.trx_date) - DATE(date_trunc('month', t.trx_date))) / 7
        )::int + 1 AS week,
        COALESCE(SUM(ti.quantity), 0)::int AS total_sold
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE
        t.trx_type = 'SALE'
        AND t.deleted_at IS NULL
        AND ti.deleted_at IS NULL
        AND t.business_id = ${businessId}
        AND t.trx_date >= date_trunc('month', now())
        AND t.trx_date < date_trunc('month', now()) + interval '1 month'
      GROUP BY week
      ORDER BY week ASC
    `)

    return result
  }

  public async topProductThisWeek(businessId: string, limit = 5) {
    const result = await prisma.$queryRaw<
      {
        product_id: string
        product_name: string
        total_sold: number
      }[]
    >(Prisma.sql`
      WITH current_week AS (
        SELECT
          date_trunc('month', now()) 
            + (FLOOR((DATE(now()) - DATE(date_trunc('month', now()))) / 7) * interval '7 day')
            AS start_week,
          date_trunc('month', now()) 
            + (FLOOR((DATE(now()) - DATE(date_trunc('month', now()))) / 7) * interval '7 day')
            + interval '7 day'
            AS end_week
      )
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(ti.quantity)::int AS total_sold
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.id
      JOIN products p ON p.id = ti.product_id
      CROSS JOIN current_week cw
      WHERE
        t.trx_type = 'SALE'
        AND t.deleted_at IS NULL
        AND ti.deleted_at IS NULL
        AND p.business_id = ${businessId}
        AND t.trx_date >= cw.start_week
        AND t.trx_date < cw.end_week
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT ${limit}
    `)

    return result
  }

  async topProductThisMonth(businessId: string, limit = 5) {
    const result = await prisma.$queryRaw<
      {
        product_id: string
        product_name: string
        total_sold: number
      }[]
    >(Prisma.sql`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        COALESCE(SUM(ti.quantity), 0)::int AS total_sold
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.id
      JOIN products p ON p.id = ti.product_id
      WHERE
        t.trx_type = 'SALE'
        AND t.deleted_at IS NULL
        AND ti.deleted_at IS NULL
        AND p.business_id = ${businessId}
        AND t.trx_date >= date_trunc('month', now())
        AND t.trx_date < date_trunc('month', now()) + interval '1 month'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT ${limit}
    `)

    return result
  }

  public async findMonthlyRevenue(businessId: string, start: Date, end: Date) {
    return prisma.transactions.findMany({
      where: {
        business_id: businessId,
        trx_type: "SALE",
        trx_date: {
          gte: start,
          lte: end,
        },
        deleted_at: null,
      },
      select: {
        total_amount: true,
        trx_date: true,
      },
      orderBy: {
        trx_date: "asc",
      },
    })
  }

  public async findMonthlySalesWithStock(
    businessId: string,
    start: Date,
    end: Date
  ) {
    return prisma.transactionItems.findMany({
      where: {
        deleted_at: null,
        transaction: {
          business_id: businessId,
          trx_type: "SALE",
          trx_date: {
            gte: start,
            lte: end,
          },
        },
        product: {
          deleted_at: null,
        },
      },
      select: {
        quantity: true,
        created_at: true,
        transaction: {
          select: {
            trx_date: true,
          },
        },
        product: {
          select: {
            id: true,
            stocks: {
              where: { deleted_at: null },
              select: { stock_on_hand: true },
            },
          },
        },
      },
    })
  }
}