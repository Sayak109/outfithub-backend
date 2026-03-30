-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');

-- CreateTable
CREATE TABLE "tbl_coupons" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "descriptions" TEXT,
    "type" "DiscountType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_order_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_coupons_code_key" ON "tbl_coupons"("code");

-- CreateIndex
CREATE INDEX "tbl_coupons_id_code_type_idx" ON "tbl_coupons"("id", "code", "type");

-- AddForeignKey
ALTER TABLE "tbl_coupons" ADD CONSTRAINT "tbl_coupons_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
