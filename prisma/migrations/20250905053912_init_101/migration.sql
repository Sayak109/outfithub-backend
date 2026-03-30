/*
  Warnings:

  - You are about to drop the column `url` on the `tbl_in_app_notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tbl_in_app_notifications" DROP COLUMN "url";

-- CreateTable
CREATE TABLE "public"."tbl_push_notifications" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_push_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_push_notifications_id_idx" ON "public"."tbl_push_notifications"("id");
