-- CreateTable
CREATE TABLE "tbl_seller_store_front" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "primary_colour" TEXT NOT NULL,
    "secondary_colour" TEXT NOT NULL,
    "font" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_seller_store_front_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_store_front_user_id_key" ON "tbl_seller_store_front"("user_id");

-- AddForeignKey
ALTER TABLE "tbl_seller_store_front" ADD CONSTRAINT "tbl_seller_store_front_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
