/*
  Warnings:

  - You are about to drop the column `image` on the `tbl_order_cancel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_order_cancel" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "tbl_order_cancel_images" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "cancel_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_order_cancel_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_order_cancel_images" ADD CONSTRAINT "tbl_order_cancel_images_cancel_id_fkey" FOREIGN KEY ("cancel_id") REFERENCES "tbl_order_cancel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
