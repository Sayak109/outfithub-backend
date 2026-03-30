-- DropIndex
DROP INDEX "tbl_order_cancel_id_idx";

-- AlterTable
ALTER TABLE "tbl_order_cancel" ADD COLUMN     "note" TEXT;

-- CreateIndex
CREATE INDEX "tbl_order_cancel_id_customer_id_status_idx" ON "tbl_order_cancel"("id", "customer_id", "status");
