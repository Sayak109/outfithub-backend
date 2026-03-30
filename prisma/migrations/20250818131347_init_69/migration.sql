-- CreateTable
CREATE TABLE "tbl_shiprocket_order" (
    "id" BIGSERIAL NOT NULL,
    "shiprocketOrderId" BIGINT NOT NULL,
    "orderId" BIGINT NOT NULL,
    "shipmentId" BIGINT NOT NULL,
    "awb_number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_shiprocket_order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_shiprocket_order" ADD CONSTRAINT "tbl_shiprocket_order_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "tbl_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
