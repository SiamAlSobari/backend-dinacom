/*
  Warnings:

  - You are about to drop the column `trx_type` on the `activities` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TRANSACTION_SALE', 'TRANSACTION_PURCHASE', 'STOCK_ADJUSTMENT', 'CREATE_PRODUCT', 'UPDATE_PRODUCT');

-- AlterEnum
ALTER TYPE "SubscriptionDuration" ADD VALUE 'YEARLY_1';

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "trx_type",
ADD COLUMN     "activity_type" "ActivityType";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "TrxTypeActivity";

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
