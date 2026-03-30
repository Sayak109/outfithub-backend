/*
  Warnings:

  - You are about to drop the column `approval_status_id` on the `tbl_seller_wallet_withdrawal_requests` table. All the data in the column will be lost.
  - You are about to drop the column `approved_at` on the `tbl_seller_wallet_withdrawal_requests` table. All the data in the column will be lost.
  - You are about to drop the column `rejected_at` on the `tbl_seller_wallet_withdrawal_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal_requests" DROP CONSTRAINT "tbl_seller_wallet_withdrawal_requests_approval_status_id_fkey";

-- AlterTable
ALTER TABLE "tbl_seller_wallet_withdrawal_requests" DROP COLUMN "approval_status_id",
DROP COLUMN "approved_at",
DROP COLUMN "rejected_at",
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payout_status_id" BIGINT NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "tbl_payout_status" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_payout_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_payout_status_id_idx" ON "tbl_payout_status"("id");

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal_requests" ADD CONSTRAINT "tbl_seller_wallet_withdrawal_requests_payout_status_id_fkey" FOREIGN KEY ("payout_status_id") REFERENCES "tbl_payout_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
