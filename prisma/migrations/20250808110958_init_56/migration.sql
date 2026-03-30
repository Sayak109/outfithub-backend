/*
  Warnings:

  - Added the required column `total_item_amount` to the `tbl_order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_order_items" ADD COLUMN     "total_item_amount" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "tbl_wallets" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT,
    "total_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tbl_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_wallets_id_idx" ON "tbl_wallets"("id");

-- AddForeignKey
ALTER TABLE "tbl_wallets" ADD CONSTRAINT "tbl_wallets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
