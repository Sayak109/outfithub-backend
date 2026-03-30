-- CreateTable
CREATE TABLE "public"."tbl_reel_product_click_count" (
    "id" BIGSERIAL NOT NULL,
    "reel_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "count" BIGINT NOT NULL,

    CONSTRAINT "tbl_reel_product_click_count_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_reel_product_click_count_reel_id_product_id_key" ON "public"."tbl_reel_product_click_count"("reel_id", "product_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_reel_product_click_count" ADD CONSTRAINT "tbl_reel_product_click_count_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "public"."tbl_reels "("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_reel_product_click_count" ADD CONSTRAINT "tbl_reel_product_click_count_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
