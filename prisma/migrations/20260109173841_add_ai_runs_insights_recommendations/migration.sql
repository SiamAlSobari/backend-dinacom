/*
  Warnings:

  - You are about to drop the column `demand_direction` on the `ai_insights` table. All the data in the column will be lost.
  - You are about to drop the column `demand_pattern` on the `ai_insights` table. All the data in the column will be lost.
  - You are about to drop the column `main_constraint` on the `ai_insights` table. All the data in the column will be lost.
  - You are about to drop the column `priorities` on the `ai_insights` table. All the data in the column will be lost.
  - You are about to drop the column `action` on the `ai_recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `ai_recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `qty_max` on the `ai_recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `qty_min` on the `ai_recommendations` table. All the data in the column will be lost.
  - Added the required column `low` to the `ai_insights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medium` to the `ai_insights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pattern_trend_summary` to the `ai_insights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urgent` to the `ai_insights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_stock` to the `ai_recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `days_until_stockout` to the `ai_recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_max` to the `ai_recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_min` to the `ai_recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommended_action` to the `ai_recommendations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AiRecommendationsAction" ADD VALUE 'REDUCE';

-- DropForeignKey
ALTER TABLE "ai_runs" DROP CONSTRAINT "ai_runs_business_id_fkey";

-- AlterTable
ALTER TABLE "ai_insights" DROP COLUMN "demand_direction",
DROP COLUMN "demand_pattern",
DROP COLUMN "main_constraint",
DROP COLUMN "priorities",
ADD COLUMN     "low" TEXT NOT NULL,
ADD COLUMN     "medium" TEXT NOT NULL,
ADD COLUMN     "pattern_trend_summary" TEXT NOT NULL,
ADD COLUMN     "urgent" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ai_recommendations" DROP COLUMN "action",
DROP COLUMN "confidence",
DROP COLUMN "qty_max",
DROP COLUMN "qty_min",
ADD COLUMN     "current_stock" INTEGER NOT NULL,
ADD COLUMN     "days_until_stockout" INTEGER NOT NULL,
ADD COLUMN     "quantity_max" INTEGER NOT NULL,
ADD COLUMN     "quantity_min" INTEGER NOT NULL,
ADD COLUMN     "recommended_action" "AiRecommendationsAction" NOT NULL;

-- AlterTable
ALTER TABLE "ai_runs" ALTER COLUMN "error_message" DROP NOT NULL;

-- DropEnum
DROP TYPE "AiRecommendationsConfidence";

-- AddForeignKey
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
