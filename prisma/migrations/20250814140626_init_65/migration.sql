-- CreateTable
CREATE TABLE "tbl_shiprocket_token" (
    "id" BIGSERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" BIGINT NOT NULL,

    CONSTRAINT "tbl_shiprocket_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_seller_pickup_location" (
    "id" BIGSERIAL NOT NULL,
    "sellerId" BIGINT NOT NULL,
    "address" TEXT NOT NULL,
    "address_2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pin_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "shiprocketCode" BIGINT,
    "pickup_location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_seller_pickup_location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_seller_pickup_location" ADD CONSTRAINT "tbl_seller_pickup_location_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
