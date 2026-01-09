/*
  Warnings:

  - Added the required column `line_price` to the `transaction_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `transaction_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrxStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "TrxPaymentMethod" AS ENUM ('CASH', 'CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "transaction_items" ADD COLUMN     "line_price" INTEGER NOT NULL,
ADD COLUMN     "unit_price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "discount_amount" INTEGER NOT NULL,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_method" "TrxPaymentMethod" NOT NULL,
ADD COLUMN     "status" "TrxStatus" NOT NULL,
ADD COLUMN     "subtotal_amount" INTEGER NOT NULL,
ADD COLUMN     "total_amount" INTEGER NOT NULL;
