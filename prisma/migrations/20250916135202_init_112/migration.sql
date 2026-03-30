/*
  Warnings:

  - You are about to drop the column `status_id` on the `tbl_user_data_request` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tbl_user_data_request" DROP CONSTRAINT "tbl_user_data_request_status_id_fkey";

-- AlterTable
ALTER TABLE "public"."tbl_user_data_request" DROP COLUMN "status_id",
ADD COLUMN     "approval_status_id" BIGINT NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "public"."tbl_user_data_request" ADD CONSTRAINT "tbl_user_data_request_approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "public"."tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
