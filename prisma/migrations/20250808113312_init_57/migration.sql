/*
  Warnings:

  - You are about to drop the `tbl_wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_wallets" DROP CONSTRAINT "tbl_wallets_seller_id_fkey";

-- DropTable
DROP TABLE "tbl_wallets";

-- CreateTable
CREATE TABLE "tbl_seller_wallet" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tbl_seller_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_seller_wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "wallet_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "amount_earned" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_seller_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_seller_wallet_id_idx" ON "tbl_seller_wallet"("id");

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet" ADD CONSTRAINT "tbl_seller_wallet_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_transactions" ADD CONSTRAINT "tbl_seller_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "tbl_seller_wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_transactions" ADD CONSTRAINT "tbl_seller_wallet_transactions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "tbl_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
