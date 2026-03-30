-- AlterTable
ALTER TABLE "public"."tbl_customer_feedback" ADD COLUMN     "approval_status_id" BIGINT NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "public"."tbl_customer_feedback" ADD CONSTRAINT "tbl_customer_feedback_approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "public"."tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
