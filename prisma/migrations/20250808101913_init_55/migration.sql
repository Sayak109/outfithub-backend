/*
  Warnings:

  - Added the required column `seller_id` to the `tbl_order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_order_items" ADD COLUMN     "seller_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_order_items" ADD CONSTRAINT "tbl_order_items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
