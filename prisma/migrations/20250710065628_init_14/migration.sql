-- CreateTable
CREATE TABLE "tbl_seller_kyc " (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "id_proof" TEXT NOT NULL,
    "GSTIN" TEXT NOT NULL,
    "PAN" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_seller_kyc _pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_seller_kyc _user_id_key" ON "tbl_seller_kyc "("user_id");

-- AddForeignKey
ALTER TABLE "tbl_seller_kyc " ADD CONSTRAINT "tbl_seller_kyc _user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
