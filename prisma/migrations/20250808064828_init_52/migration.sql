/*
  Warnings:

  - Added the required column `amount` to the `tbl_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `tbl_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razorpayOrder_id` to the `tbl_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_orders" ADD COLUMN     "amount" DECIMAL(16,2) NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "razorpayOrder_id" TEXT NOT NULL;
