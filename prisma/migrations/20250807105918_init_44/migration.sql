/*
  Warnings:

  - Made the column `item_metadata` on table `tbl_order_items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_order_items" ALTER COLUMN "item_metadata" SET NOT NULL,
ALTER COLUMN "item_metadata" SET DATA TYPE TEXT;
