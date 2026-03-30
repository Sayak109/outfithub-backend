/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `tbl_seller_profile ` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."tbl_seller_profile " ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_profile _slug_key" ON "public"."tbl_seller_profile "("slug");
