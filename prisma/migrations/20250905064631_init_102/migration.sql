/*
  Warnings:

  - You are about to drop the column `image` on the `tbl_push_notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tbl_push_notifications" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "public"."tbl_push_notification_images" (
    "id" BIGSERIAL NOT NULL,
    "src" TEXT NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_push_notification_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_push_notification_images_id_idx" ON "public"."tbl_push_notification_images"("id");

-- AddForeignKey
ALTER TABLE "public"."tbl_push_notification_images" ADD CONSTRAINT "tbl_push_notification_images_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."tbl_push_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
