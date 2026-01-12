-- CreateEnum
CREATE TYPE "TrxTypeActivity" AS ENUM ('SALE', 'PURCHASE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "activity_text" TEXT NOT NULL,
    "trx_type" "TrxTypeActivity",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "notification_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_business_id_deleted_at_idx" ON "activities"("business_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_business_id_deleted_at_idx" ON "notifications"("business_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
