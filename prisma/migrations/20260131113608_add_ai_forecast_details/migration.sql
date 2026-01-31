-- CreateTable
CREATE TABLE "ai_run_meta" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "total_products" INTEGER NOT NULL,
    "llm_enabled" BOOLEAN NOT NULL,
    "llm_success_count" INTEGER NOT NULL,
    "fallback_count" INTEGER NOT NULL,
    "total_tokens_used" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_run_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_portfolio_insights" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "trends" JSONB NOT NULL,
    "priority_actions" JSONB NOT NULL,
    "risk_distribution" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_portfolio_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_forecasts" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "horizon_days" INTEGER NOT NULL,
    "daily_forecast" JSONB NOT NULL,
    "total_demand" INTEGER NOT NULL,
    "average_per_day" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_product_analysis" (
    "id" TEXT NOT NULL,
    "ai_run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "days_until_stockout" INTEGER,
    "risk_level" "AiRecommendationsRiskLevel" NOT NULL,
    "urgency_score" INTEGER NOT NULL,
    "forecast_reliability" TEXT NOT NULL,
    "priority_score" INTEGER NOT NULL,
    "priority_tier" TEXT NOT NULL,
    "sales_patterns" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_product_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_run_meta_ai_run_id_key" ON "ai_run_meta"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_run_meta_ai_run_id_idx" ON "ai_run_meta"("ai_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_portfolio_insights_ai_run_id_key" ON "ai_portfolio_insights"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_portfolio_insights_ai_run_id_idx" ON "ai_portfolio_insights"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_forecasts_ai_run_id_idx" ON "ai_forecasts"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_forecasts_product_id_idx" ON "ai_forecasts"("product_id");

-- CreateIndex
CREATE INDEX "ai_product_analysis_ai_run_id_idx" ON "ai_product_analysis"("ai_run_id");

-- CreateIndex
CREATE INDEX "ai_product_analysis_product_id_idx" ON "ai_product_analysis"("product_id");

-- AddForeignKey
ALTER TABLE "ai_run_meta" ADD CONSTRAINT "ai_run_meta_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_portfolio_insights" ADD CONSTRAINT "ai_portfolio_insights_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_forecasts" ADD CONSTRAINT "ai_forecasts_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_forecasts" ADD CONSTRAINT "ai_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_product_analysis" ADD CONSTRAINT "ai_product_analysis_ai_run_id_fkey" FOREIGN KEY ("ai_run_id") REFERENCES "ai_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_product_analysis" ADD CONSTRAINT "ai_product_analysis_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
