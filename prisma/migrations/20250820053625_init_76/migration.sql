/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `tbl_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tbl_orders_id_idx";

-- AlterTable
ALTER TABLE "tbl_orders" ADD COLUMN     "order_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_orders_order_id_key" ON "tbl_orders"("order_id");

-- CreateIndex
CREATE INDEX "tbl_orders_id_order_id_idx" ON "tbl_orders"("id", "order_id");
