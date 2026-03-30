/*
  Warnings:

  - You are about to drop the column `attribute_term_id` on the `tbe_cart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbe_cart" DROP CONSTRAINT "tbe_cart_attribute_term_id_fkey";

-- AlterTable
ALTER TABLE "tbe_cart" DROP COLUMN "attribute_term_id";

-- CreateTable
CREATE TABLE "tbe_cart_attribute_term" (
    "id" BIGSERIAL NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "attribute_term_id" BIGINT NOT NULL,

    CONSTRAINT "tbe_cart_attribute_term_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbe_cart_attribute_term_cart_id_attribute_term_id_key" ON "tbe_cart_attribute_term"("cart_id", "attribute_term_id");

-- AddForeignKey
ALTER TABLE "tbe_cart_attribute_term" ADD CONSTRAINT "tbe_cart_attribute_term_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "tbe_cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbe_cart_attribute_term" ADD CONSTRAINT "tbe_cart_attribute_term_attribute_term_id_fkey" FOREIGN KEY ("attribute_term_id") REFERENCES "tbl_product_attribute_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
