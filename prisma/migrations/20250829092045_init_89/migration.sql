-- CreateTable
CREATE TABLE "NotificationActor" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationActor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificationActor" ADD CONSTRAINT "NotificationActor_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "tbl_in_app_notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
