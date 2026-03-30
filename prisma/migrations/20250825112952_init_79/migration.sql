/*
  Warnings:

  - A unique constraint covering the columns `[pickup_location]` on the table `tbl_seller_pickup_location` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "tbl_product_box" (
    "id" BIGSERIAL NOT NULL,
    "length" BIGINT NOT NULL,
    "breadth" BIGINT NOT NULL,
    "height" BIGINT NOT NULL,
    "weight" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,

    CONSTRAINT "tbl_product_box_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_pickup_location_pickup_location_key" ON "tbl_seller_pickup_location"("pickup_location");

-- AddForeignKey
ALTER TABLE "tbl_product_box" ADD CONSTRAINT "tbl_product_box_productId_fkey" FOREIGN KEY ("productId") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
