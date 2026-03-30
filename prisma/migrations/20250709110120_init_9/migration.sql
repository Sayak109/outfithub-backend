-- CreateTable
CREATE TABLE "tbl_admin_activity_log" (
    "id" BIGSERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "table" TEXT,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_admin_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_admin_activity_log_id_idx" ON "tbl_admin_activity_log"("id");
