/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `tbl_seller_store_front` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_store_front_link_key" ON "tbl_seller_store_front"("link");
