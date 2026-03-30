/*
  Warnings:

  - You are about to drop the column `order_status_id` on the `tbl_order_details` table. All the data in the column will be lost.
  - You are about to drop the `tbl_seller_wallet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `order_status_id` to the `tbl_order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_order_details" DROP CONSTRAINT "tbl_order_details_order_status_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_seller_wallet" DROP CONSTRAINT "tbl_seller_wallet_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_seller_wallet_transactions" DROP CONSTRAINT "tbl_seller_wallet_transactions_wallet_id_fkey";

-- AlterTable
ALTER TABLE "tbl_order_details" DROP COLUMN "order_status_id";

-- AlterTable
ALTER TABLE "tbl_order_items" ADD COLUMN     "order_status_id" BIGINT NOT NULL;

-- DropTable
DROP TABLE "tbl_seller_wallet";

-- CreateTable
CREATE TABLE "tbl_wallet" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tbl_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_wallet_user_id_key" ON "tbl_wallet"("user_id");

-- CreateIndex
CREATE INDEX "tbl_wallet_id_idx" ON "tbl_wallet"("id");

-- AddForeignKey
ALTER TABLE "tbl_order_items" ADD CONSTRAINT "tbl_order_items_order_status_id_fkey" FOREIGN KEY ("order_status_id") REFERENCES "tbl_order_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_wallet" ADD CONSTRAINT "tbl_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_transactions" ADD CONSTRAINT "tbl_seller_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "tbl_wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
