/*
  Warnings:

  - You are about to drop the column `billing_id` on the `tbl_order_details` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_id` on the `tbl_order_details` table. All the data in the column will be lost.
  - Added the required column `billing` to the `tbl_order_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping` to the `tbl_order_details` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_order_details" DROP CONSTRAINT "tbl_order_details_billing_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_order_details" DROP CONSTRAINT "tbl_order_details_shipping_id_fkey";

-- AlterTable
ALTER TABLE "tbl_order_details" DROP COLUMN "billing_id",
DROP COLUMN "shipping_id",
ADD COLUMN     "billing" TEXT NOT NULL,
ADD COLUMN     "shipping" TEXT NOT NULL;
