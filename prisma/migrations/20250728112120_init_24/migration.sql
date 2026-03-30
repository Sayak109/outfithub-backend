-- CreateTable
CREATE TABLE "tbl_seller_aggrement " (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_seller_aggrement _pkey" PRIMARY KEY ("id")
);
