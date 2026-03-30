-- CreateTable
CREATE TABLE "tbl_customer_feedback" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "ratings" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "product_id" BIGINT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_customer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_customer_feedback_images" (
    "id" BIGSERIAL NOT NULL,
    "src" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alt" TEXT,
    "feedback_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_customer_feedback_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_customer_feedback_user_id_ratings_description_idx" ON "tbl_customer_feedback"("user_id", "ratings", "description");

-- CreateIndex
CREATE INDEX "tbl_customer_feedback_images_id_idx" ON "tbl_customer_feedback_images"("id");

-- AddForeignKey
ALTER TABLE "tbl_customer_feedback" ADD CONSTRAINT "tbl_customer_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer_feedback" ADD CONSTRAINT "tbl_customer_feedback_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer_feedback_images" ADD CONSTRAINT "tbl_customer_feedback_images_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "tbl_customer_feedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
