/*
  Warnings:

  - You are about to drop the column `is_withdrawn` on the `tbl_seller_wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the `tbl_seller_wallet_withdrawal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal" DROP CONSTRAINT "tbl_seller_wallet_withdrawal_seller_id_fkey";

-- AlterTable
ALTER TABLE "tbl_seller_wallet_transactions" DROP COLUMN "is_withdrawn",
ADD COLUMN     "withdrawalRequest_id" BIGINT,
ADD COLUMN     "withdrawn_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "tbl_seller_wallet_withdrawal";

-- CreateTable
CREATE TABLE "tbl_seller_wallet_withdrawal_requests" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "approval_status_id" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),

    CONSTRAINT "tbl_seller_wallet_withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_transactions" ADD CONSTRAINT "tbl_seller_wallet_transactions_withdrawalRequest_id_fkey" FOREIGN KEY ("withdrawalRequest_id") REFERENCES "tbl_seller_wallet_withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal_requests" ADD CONSTRAINT "tbl_seller_wallet_withdrawal_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal_requests" ADD CONSTRAINT "tbl_seller_wallet_withdrawal_requests_approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
