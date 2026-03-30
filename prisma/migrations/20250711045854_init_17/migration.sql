-- CreateTable
CREATE TABLE "tbl_admin_settings" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_admin_settings_pkey" PRIMARY KEY ("id")
);
