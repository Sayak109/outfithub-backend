-- CreateTable
CREATE TABLE "tbl_reels " (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "reel" TEXT NOT NULL,
    "product_ids" INTEGER[],
    "approval_status_id" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_reels _pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_reels _seller_id_approval_status_id_idx" ON "tbl_reels "("seller_id", "approval_status_id");

-- AddForeignKey
ALTER TABLE "tbl_reels " ADD CONSTRAINT "tbl_reels _seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_reels " ADD CONSTRAINT "tbl_reels _approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
