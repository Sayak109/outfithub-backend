/*
  Warnings:

  - Added the required column `cart_amount` to the `tbl_order_details` table without a default value. This is not possible if the table is not empty.
  - Made the column `order_status_id` on table `tbl_order_details` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tbl_order_details" DROP CONSTRAINT "tbl_order_details_order_status_id_fkey";

-- AlterTable
ALTER TABLE "tbl_order_details" ADD COLUMN     "cart_amount" INTEGER NOT NULL,
ADD COLUMN     "discount_amount" INTEGER DEFAULT 0,
ALTER COLUMN "order_amount" DROP DEFAULT,
ALTER COLUMN "order_status_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_order_status_id_fkey" FOREIGN KEY ("order_status_id") REFERENCES "tbl_order_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
