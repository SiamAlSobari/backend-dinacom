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

}