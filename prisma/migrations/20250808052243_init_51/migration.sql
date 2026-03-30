/*
  Warnings:

  - You are about to alter the column `discount_amount` on the `tbl_order_details` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - Made the column `discount_amount` on table `tbl_order_details` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_order_details" ALTER COLUMN "discount_amount" SET NOT NULL,
ALTER COLUMN "discount_amount" DROP DEFAULT,
ALTER COLUMN "discount_amount" SET DATA TYPE DECIMAL(10,2);
