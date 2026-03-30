/*
  Warnings:

  - You are about to drop the column `orderId` on the `tbl_shiprocket_order` table. All the data in the column will be lost.
  - Added the required column `orderItemsId` to the `tbl_shiprocket_order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_shiprocket_order" DROP CONSTRAINT "tbl_shiprocket_order_orderId_fkey";

-- AlterTable
ALTER TABLE "tbl_shiprocket_order" DROP COLUMN "orderId",
ADD COLUMN     "orderItemsId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_shiprocket_order" ADD CONSTRAINT "tbl_shiprocket_order_orderItemsId_fkey" FOREIGN KEY ("orderItemsId") REFERENCES "tbl_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
