/*
  Warnings:

  - You are about to alter the column `cart_amount` on the `tbl_order_details` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "tbl_order_details" ALTER COLUMN "cart_amount" SET DATA TYPE DECIMAL(10,2);
