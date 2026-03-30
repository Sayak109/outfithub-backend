-- CreateTable
CREATE TABLE "tbl_live " (
    "id" BIGSERIAL NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER,
    "product_ids" INTEGER[],
    "approval_status_id" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_live _pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_live _seller_id_approval_status_id_idx" ON "tbl_live "("seller_id", "approval_status_id");

-- AddForeignKey
ALTER TABLE "tbl_live " ADD CONSTRAINT "tbl_live _seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_live " ADD CONSTRAINT "tbl_live _approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
