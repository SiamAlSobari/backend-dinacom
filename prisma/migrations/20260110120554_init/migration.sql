/*
  Warnings:

  - You are about to drop the column `status` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `price` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "status";

-- DropEnum
DROP TYPE "TrxStatus";
