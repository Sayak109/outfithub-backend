/*
  Warnings:

  - You are about to drop the column `order_key` on the `tbl_orders` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrder_id` on the `tbl_orders` table. All the data in the column will be lost.
  - Added the required column `rzp_order_id` to the `tbl_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_orders" DROP COLUMN "order_key",
DROP COLUMN "razorpayOrder_id",
ADD COLUMN     "rzp_order_id" TEXT NOT NULL,
ADD COLUMN     "rzp_transaction_id" TEXT;
