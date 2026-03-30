/*
  Warnings:

  - Added the required column `seller_id` to the `tbl_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_products" ADD COLUMN     "seller_id" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "tbl_seller_profile " (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "mobile_number" TEXT,
    "gender" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_tag" TEXT,
    "bank_business_name" TEXT,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_seller_profile _pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_profile _user_id_key" ON "tbl_seller_profile "("user_id");

-- CreateIndex
CREATE INDEX "tbl_seller_profile _gender_city_state_pincode_mobile_number_idx" ON "tbl_seller_profile "("gender", "city", "state", "pincode", "mobile_number");

-- AddForeignKey
ALTER TABLE "tbl_products" ADD CONSTRAINT "tbl_products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_seller_profile " ADD CONSTRAINT "tbl_seller_profile _user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
