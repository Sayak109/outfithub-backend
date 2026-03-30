-- CreateTable
CREATE TABLE "tbl_cart_holding_items" (
    "id" BIGSERIAL NOT NULL,
    "items" TEXT NOT NULL,
    "unavailable_product_ids" INTEGER[],
    "user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_cart_holding_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_cart_holding_items_user_id_key" ON "tbl_cart_holding_items"("user_id");

-- CreateIndex
CREATE INDEX "tbl_cart_holding_items_id_idx" ON "tbl_cart_holding_items"("id");

-- AddForeignKey
ALTER TABLE "tbl_cart_holding_items" ADD CONSTRAINT "tbl_cart_holding_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
