/*
  Warnings:

  - Added the required column `tax` to the `tbl_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_products" ADD COLUMN     "shipping" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "tax" INTEGER NOT NULL;
