-- CreateTable
CREATE TABLE "tbl_otp" (
    "id" BIGSERIAL NOT NULL,
    "credential" TEXT,
    "OTP" INTEGER NOT NULL,
    "limit" INTEGER,
    "restrictedTime" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_otp_id_credential_OTP_idx" ON "tbl_otp"("id", "credential", "OTP");
