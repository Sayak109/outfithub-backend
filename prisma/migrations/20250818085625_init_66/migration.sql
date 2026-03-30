-- AlterTable
ALTER TABLE "tbl_order_details" ADD COLUMN     "total_tax" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "tbl_seller_wallet_withdrawal" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_seller_wallet_withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_wallet_withdrawal_seller_id_key" ON "tbl_seller_wallet_withdrawal"("seller_id");

-- AddForeignKey
ALTER TABLE "tbl_seller_wallet_withdrawal" ADD CONSTRAINT "tbl_seller_wallet_withdrawal_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
