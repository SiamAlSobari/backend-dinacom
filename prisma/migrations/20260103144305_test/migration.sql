-- CreateEnum
CREATE TYPE "SubscriptionDuration" AS ENUM ('MONTHLY_1', 'MONTHLY_2', 'MONTHLY_3');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CAPTURE', 'SETTLEMENT', 'DENY', 'CANCEL', 'EXPIRED', 'REFUND');

-- CreateEnum
CREATE TYPE "AiRecommendationsAction" AS ENUM ('RESTOCK', 'WAIT');

-- CreateEnum
CREATE TYPE "AiRecommendationsRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AiRecommendationsConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AiRecommendationsActionsActionType" AS ENUM ('DONE', 'DELAY', 'IGNORE');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_duration" "SubscriptionDuration" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "gross_amount" INTEGER NOT NULL,
    "payment_type" TEXT,
    "transaction_time" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "demand_pattern" TEXT NOT NULL,
    "demand_direction" TEXT NOT NULL,
    "main_constraint" TEXT NOT NULL,
    "priorities" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "action" "AiRecommendationsAction" NOT NULL,
    "qty_min" INTEGER NOT NULL,
    "qty_max" INTEGER NOT NULL,
    "risk_level" "AiRecommendationsRiskLevel" NOT NULL,
    "confidence" "AiRecommendationsConfidence" NOT NULL,
    "reason_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations_actions" (
    "id" TEXT NOT NULL,
    "ai_recommendation_id" TEXT NOT NULL,
    "action_type" "AiRecommendationsActionsActionType" NOT NULL,
    "note_text" TEXT NOT NULL,
    "action_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_recommendations_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_user_id_deleted_at_idx" ON "subscriptions"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_deleted_at_key" ON "subscriptions"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "payments_user_id_deleted_at_idx" ON "payments"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "ai_insights_ai_run_id_idx" ON "ai_insights"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_ai_run_id_idx" ON "ai_recommendations"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_product_id_idx" ON "ai_recommendations"("product_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_actions_ai_recommendation_id_idx" ON "ai_recommendations_actions"("ai_recommendation_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations_actions" ADD CONSTRAINT "ai_recommendations_actions_ai_recommendation_id_fkey" FOREIGN KEY ("ai_recommendation_id") REFERENCES "ai_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
