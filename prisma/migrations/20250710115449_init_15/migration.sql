-- AlterTable
ALTER TABLE "tbl_seller_profile " ADD COLUMN     "business_logo" TEXT;

-- CreateTable
CREATE TABLE "tbl_social_links" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_social_links_seller_id_key" ON "tbl_social_links"("seller_id");

-- AddForeignKey
ALTER TABLE "tbl_social_links" ADD CONSTRAINT "tbl_social_links_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
