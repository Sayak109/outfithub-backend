/*
  Warnings:

  - Added the required column `billing_id` to the `tbl_order_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_id` to the `tbl_order_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_order_details" ADD COLUMN     "billing_id" BIGINT NOT NULL,
ADD COLUMN     "shipping_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_shipping_id_fkey" FOREIGN KEY ("shipping_id") REFERENCES "tbl_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "tbl_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
