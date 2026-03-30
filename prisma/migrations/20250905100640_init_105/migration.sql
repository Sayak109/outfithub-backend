-- CreateTable
CREATE TABLE "public"."tbl_user_data_request" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "user_email" TEXT NOT NULL,
    "status_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_data_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_user_data_request_id_idx" ON "public"."tbl_user_data_request"("id");

-- AddForeignKey
ALTER TABLE "public"."tbl_user_data_request" ADD CONSTRAINT "tbl_user_data_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_user_data_request" ADD CONSTRAINT "tbl_user_data_request_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
