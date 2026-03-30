-- CreateTable
CREATE TABLE "public"."tbl_meta_data" (
    "id" BIGSERIAL NOT NULL,
    "table_id" BIGINT NOT NULL,
    "table_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_meta_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_meta_data_id_table_id_table_name_key_idx" ON "public"."tbl_meta_data"("id", "table_id", "table_name", "key");
