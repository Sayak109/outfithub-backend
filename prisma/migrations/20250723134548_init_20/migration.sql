-- CreateTable
CREATE TABLE "tbe_cart" (
    "id" BIGSERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "attribute_term_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbe_cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbe_cart_id_customer_id_idx" ON "tbe_cart"("id", "customer_id");

-- AddForeignKey
ALTER TABLE "tbe_cart" ADD CONSTRAINT "tbe_cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbe_cart" ADD CONSTRAINT "tbe_cart_attribute_term_id_fkey" FOREIGN KEY ("attribute_term_id") REFERENCES "tbl_product_attribute_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbe_cart" ADD CONSTRAINT "tbe_cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
