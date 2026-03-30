-- CreateTable
CREATE TABLE "tbl_order_refund" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "payment_id" TEXT NOT NULL,
    "refund_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_order_refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_order_refund_id_idx" ON "tbl_order_refund"("id");

-- AddForeignKey
ALTER TABLE "tbl_order_refund" ADD CONSTRAINT "tbl_order_refund_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_refund" ADD CONSTRAINT "tbl_order_refund_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tbl_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_refund" ADD CONSTRAINT "tbl_order_refund_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "tbl_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
