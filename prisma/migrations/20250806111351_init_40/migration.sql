/*
  Warnings:

  - You are about to drop the `tbe_cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbe_cart_attribute_term` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbe_cart" DROP CONSTRAINT "tbe_cart_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "tbe_cart" DROP CONSTRAINT "tbe_cart_product_id_fkey";

-- DropForeignKey
ALTER TABLE "tbe_cart_attribute_term" DROP CONSTRAINT "tbe_cart_attribute_term_attribute_term_id_fkey";

-- DropForeignKey
ALTER TABLE "tbe_cart_attribute_term" DROP CONSTRAINT "tbe_cart_attribute_term_cart_id_fkey";

-- DropTable
DROP TABLE "tbe_cart";

-- DropTable
DROP TABLE "tbe_cart_attribute_term";

-- CreateTable
CREATE TABLE "tbl_cart" (
    "id" BIGSERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_cart_attribute_term" (
    "id" BIGSERIAL NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "attribute_term_id" BIGINT NOT NULL,

    CONSTRAINT "tbl_cart_attribute_term_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_cart_id_customer_id_idx" ON "tbl_cart"("id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_cart_attribute_term_cart_id_attribute_term_id_key" ON "tbl_cart_attribute_term"("cart_id", "attribute_term_id");

-- AddForeignKey
ALTER TABLE "tbl_cart" ADD CONSTRAINT "tbl_cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_cart" ADD CONSTRAINT "tbl_cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_cart_attribute_term" ADD CONSTRAINT "tbl_cart_attribute_term_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "tbl_cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_cart_attribute_term" ADD CONSTRAINT "tbl_cart_attribute_term_attribute_term_id_fkey" FOREIGN KEY ("attribute_term_id") REFERENCES "tbl_product_attribute_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
