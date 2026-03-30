/*
  Warnings:

  - Added the required column `platform_fee_amount` to the `tbl_seller_wallet_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_seller_wallet_transactions" ADD COLUMN     "platform_fee_amount" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "platform_fee" SET DATA TYPE TEXT;
