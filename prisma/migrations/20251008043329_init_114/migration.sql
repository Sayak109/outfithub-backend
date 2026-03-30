/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `tbl_live ` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `tbl_reels ` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."tbl_live " ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."tbl_reels " ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_live _slug_key" ON "public"."tbl_live "("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_reels _slug_key" ON "public"."tbl_reels "("slug");
