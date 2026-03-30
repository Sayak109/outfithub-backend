/*
  Warnings:

  - You are about to drop the column `status` on the `tbl_order_cancel` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tbl_order_cancel_id_customer_id_status_idx";

-- AlterTable
ALTER TABLE "tbl_order_cancel" DROP COLUMN "status",
ADD COLUMN     "refund_status" TEXT,
ADD COLUMN     "status_id" BIGINT NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "tbl_seller_wallet_transactions" ADD COLUMN     "cancellation_charge" TEXT,
ADD COLUMN     "cancellation_charges_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tbl_order_cancel_id_customer_id_status_id_refund_status_idx" ON "tbl_order_cancel"("id", "customer_id", "status_id", "refund_status");

-- AddForeignKey
ALTER TABLE "tbl_order_cancel" ADD CONSTRAINT "tbl_order_cancel_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_order_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
