/*
  Warnings:

  - You are about to drop the `NotificationActor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NotificationActor" DROP CONSTRAINT "NotificationActor_notification_id_fkey";

-- DropTable
DROP TABLE "NotificationActor";

-- CreateTable
CREATE TABLE "tbl_notification_actors" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_notification_actors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_notification_actors_notification_id_user_id_key" ON "tbl_notification_actors"("notification_id", "user_id");

-- AddForeignKey
ALTER TABLE "tbl_notification_actors" ADD CONSTRAINT "tbl_notification_actors_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "tbl_in_app_notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
