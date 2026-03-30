-- CreateTable
CREATE TABLE "tbl_notification_preference_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "parent" BIGINT,

    CONSTRAINT "tbl_notification_preference_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_notification_preference" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "preference_category_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_notification_preference_categories_key_key" ON "tbl_notification_preference_categories"("key");

-- AddForeignKey
ALTER TABLE "tbl_notification_preference_categories" ADD CONSTRAINT "tbl_notification_preference_categories_parent_fkey" FOREIGN KEY ("parent") REFERENCES "tbl_notification_preference_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_notification_preference" ADD CONSTRAINT "tbl_notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_notification_preference" ADD CONSTRAINT "tbl_notification_preference_preference_category_id_fkey" FOREIGN KEY ("preference_category_id") REFERENCES "tbl_notification_preference_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
