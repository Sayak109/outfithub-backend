/*
  Warnings:

  - A unique constraint covering the columns `[seller_id]` on the table `tbl_seller_wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_wallet_seller_id_key" ON "tbl_seller_wallet"("seller_id");
