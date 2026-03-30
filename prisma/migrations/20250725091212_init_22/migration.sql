-- CreateTable
CREATE TABLE "tbl_order_status" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_order_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_orders" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "order_key" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_order_items" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT,
    "item_metadata" JSONB,
    "item_quantity" INTEGER NOT NULL,
    "order_id" BIGINT NOT NULL,

    CONSTRAINT "tbl_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_order_details" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "order_itm_qty" INTEGER,
    "order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "order_status_id" BIGINT,

    CONSTRAINT "tbl_order_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_orders_id_idx" ON "tbl_orders"("id");

-- CreateIndex
CREATE INDEX "tbl_order_items_id_order_id_idx" ON "tbl_order_items"("id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_order_details_order_id_key" ON "tbl_order_details"("order_id");

-- CreateIndex
CREATE INDEX "tbl_order_details_order_id_idx" ON "tbl_order_details"("order_id");

-- AddForeignKey
ALTER TABLE "tbl_orders" ADD CONSTRAINT "tbl_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_items" ADD CONSTRAINT "tbl_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_items" ADD CONSTRAINT "tbl_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tbl_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tbl_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_order_details" ADD CONSTRAINT "tbl_order_details_order_status_id_fkey" FOREIGN KEY ("order_status_id") REFERENCES "tbl_order_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
