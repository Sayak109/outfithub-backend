/*
  Warnings:

  - Added the required column `pickup_location_id` to the `tbl_shiprocket_order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_shiprocket_order" ADD COLUMN     "pickup_location_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_shiprocket_order" ADD CONSTRAINT "tbl_shiprocket_order_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "tbl_seller_pickup_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
