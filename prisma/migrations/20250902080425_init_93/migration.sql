-- AlterTable
ALTER TABLE "public"."tbl_order_cancel" ADD COLUMN     "isRefunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReturnAccepted" BOOLEAN NOT NULL DEFAULT false;
