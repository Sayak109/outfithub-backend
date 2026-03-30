/*
  Warnings:

  - You are about to drop the column `cart_amount` on the `tbl_order_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_order_details" DROP COLUMN "cart_amount",
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
