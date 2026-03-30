/*
  Warnings:

  - You are about to drop the column `platform_fee` on the `tbl_seller_wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `platform_fee_amount` on the `tbl_seller_wallet_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_seller_wallet_transactions" DROP COLUMN "platform_fee",
DROP COLUMN "platform_fee_amount",
ADD COLUMN     "commision_charge" TEXT,
ADD COLUMN     "commision_charges_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;
