-- CreateEnum
CREATE TYPE "WishListType" AS ENUM ('WISHLIST', 'SAVEFORLATER', 'RESENTLYVIEWPRODUCT');

-- CreateTable
CREATE TABLE "tbl_user_wish_lists" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "list_type" "WishListType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_wish_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_user_wish_lists_id_product_id_idx" ON "tbl_user_wish_lists"("id", "product_id");

-- AddForeignKey
ALTER TABLE "tbl_user_wish_lists" ADD CONSTRAINT "tbl_user_wish_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_user_wish_lists" ADD CONSTRAINT "tbl_user_wish_lists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
