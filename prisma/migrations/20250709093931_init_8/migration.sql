/*
  Warnings:

  - You are about to drop the column `descriptions` on the `tbl_coupons` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `tbl_coupons` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "tbl_coupons" DROP COLUMN "descriptions",
ADD COLUMN     "desc" TEXT,
ALTER COLUMN "amount" DROP DEFAULT,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;
