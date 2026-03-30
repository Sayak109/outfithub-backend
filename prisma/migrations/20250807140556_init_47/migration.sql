/*
  Warnings:

  - You are about to drop the column `coupon_metadata` on the `tbl_order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_order_details" ADD COLUMN     "coupon_metadata" TEXT;

-- AlterTable
ALTER TABLE "tbl_order_items" DROP COLUMN "coupon_metadata";
