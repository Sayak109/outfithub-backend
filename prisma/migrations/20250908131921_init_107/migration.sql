-- CreateTable
CREATE TABLE "public"."tbl_nofity_me" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" BIGINT,
    "product_id" BIGINT NOT NULL,
    "reply_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_nofity_me_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_nofity_me_email_reply_sent_idx" ON "public"."tbl_nofity_me"("email", "reply_sent");

-- AddForeignKey
ALTER TABLE "public"."tbl_nofity_me" ADD CONSTRAINT "tbl_nofity_me_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_nofity_me" ADD CONSTRAINT "tbl_nofity_me_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
