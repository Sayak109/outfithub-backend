-- DropIndex
DROP INDEX "tbl_products_id_sku_name_slug_description_status_id_idx";

-- AlterTable
ALTER TABLE "tbl_products" ADD COLUMN     "approval_status_id" BIGINT NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "tbl_users" ALTER COLUMN "approval_status_id" SET DEFAULT 1,
ALTER COLUMN "account_status_id" SET DEFAULT 1;

-- CreateIndex
CREATE INDEX "tbl_products_id_sku_name_slug_description_approval_status_i_idx" ON "tbl_products"("id", "sku", "name", "slug", "description", "approval_status_id", "status_id");

-- AddForeignKey
ALTER TABLE "tbl_products" ADD CONSTRAINT "tbl_products_approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
