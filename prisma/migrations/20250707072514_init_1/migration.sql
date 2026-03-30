-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('GOOGLE', 'APPLE', 'EMAIL');

-- CreateTable
CREATE TABLE "tbl_approval_status" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_approval_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_account_status" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_account_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_status" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_roles" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_users" (
    "id" BIGSERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_no" TEXT,
    "password" TEXT,
    "image" TEXT,
    "provider" "AuthType" NOT NULL,
    "provider_id" TEXT,
    "fcm_token" TEXT,
    "reset_token" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "role_id" BIGINT NOT NULL,
    "approval_status_id" BIGINT NOT NULL,
    "account_status_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_user_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_products" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "slug" VARCHAR(150) NOT NULL,
    "permalink" VARCHAR(255),
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "description" TEXT,
    "sku" TEXT,
    "mrp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sales_price" DECIMAL(10,2) DEFAULT 0,
    "new_collection" BOOLEAN DEFAULT true,
    "out_of_stock" BOOLEAN DEFAULT false,
    "stock_quantity" INTEGER,
    "average_rating" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_attributes" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_attribute_terms" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "attribute_id" BIGINT NOT NULL,
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "term_rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_attribute_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_to_product_terms" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "attribute_id" BIGINT NOT NULL,
    "attribute_term_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_to_product_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_category" BIGINT,
    "description" TEXT,
    "show_home_page" BOOLEAN DEFAULT false,
    "image" TEXT,
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 0,
    "display_rank" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_images" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "product_id" BIGINT NOT NULL,
    "main_image" BOOLEAN NOT NULL DEFAULT false,
    "display_rank" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToProductCategory" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_ProductToProductCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToProductAttribute" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_ProductToProductAttribute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "tbl_approval_status_id_idx" ON "tbl_approval_status"("id");

-- CreateIndex
CREATE INDEX "tbl_account_status_id_idx" ON "tbl_account_status"("id");

-- CreateIndex
CREATE INDEX "tbl_status_id_idx" ON "tbl_status"("id");

-- CreateIndex
CREATE INDEX "tbl_roles_id_idx" ON "tbl_roles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_email_key" ON "tbl_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_reset_token_key" ON "tbl_users"("reset_token");

-- CreateIndex
CREATE INDEX "tbl_users_first_name_last_name_email_phone_no_role_id_appro_idx" ON "tbl_users"("first_name", "last_name", "email", "phone_no", "role_id", "approval_status_id", "account_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_tokens_token_key" ON "tbl_user_tokens"("token");

-- CreateIndex
CREATE INDEX "tbl_user_tokens_id_idx" ON "tbl_user_tokens"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_products_slug_key" ON "tbl_products"("slug");

-- CreateIndex
CREATE INDEX "tbl_products_id_sku_name_slug_description_status_id_idx" ON "tbl_products"("id", "sku", "name", "slug", "description", "status_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_attributes_slug_key" ON "tbl_product_attributes"("slug");

-- CreateIndex
CREATE INDEX "tbl_product_attributes_name_slug_idx" ON "tbl_product_attributes"("name", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_attribute_terms_slug_key" ON "tbl_product_attribute_terms"("slug");

-- CreateIndex
CREATE INDEX "tbl_product_attribute_terms_name_slug_idx" ON "tbl_product_attribute_terms"("name", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_categories_slug_key" ON "tbl_product_categories"("slug");

-- CreateIndex
CREATE INDEX "tbl_product_categories_name_slug_parent_category_idx" ON "tbl_product_categories"("name", "slug", "parent_category");

-- CreateIndex
CREATE INDEX "_ProductToProductCategory_B_index" ON "_ProductToProductCategory"("B");

-- CreateIndex
CREATE INDEX "_ProductToProductAttribute_B_index" ON "_ProductToProductAttribute"("B");

-- AddForeignKey
ALTER TABLE "tbl_users" ADD CONSTRAINT "tbl_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tbl_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_users" ADD CONSTRAINT "tbl_users_approval_status_id_fkey" FOREIGN KEY ("approval_status_id") REFERENCES "tbl_approval_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_users" ADD CONSTRAINT "tbl_users_account_status_id_fkey" FOREIGN KEY ("account_status_id") REFERENCES "tbl_account_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_user_tokens" ADD CONSTRAINT "tbl_user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_products" ADD CONSTRAINT "tbl_products_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_attributes" ADD CONSTRAINT "tbl_product_attributes_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_attribute_terms" ADD CONSTRAINT "tbl_product_attribute_terms_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "tbl_product_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_attribute_terms" ADD CONSTRAINT "tbl_product_attribute_terms_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_to_product_terms" ADD CONSTRAINT "tbl_product_to_product_terms_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_to_product_terms" ADD CONSTRAINT "tbl_product_to_product_terms_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "tbl_product_attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_to_product_terms" ADD CONSTRAINT "tbl_product_to_product_terms_attribute_term_id_fkey" FOREIGN KEY ("attribute_term_id") REFERENCES "tbl_product_attribute_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_categories" ADD CONSTRAINT "tbl_product_categories_parent_category_fkey" FOREIGN KEY ("parent_category") REFERENCES "tbl_product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_categories" ADD CONSTRAINT "tbl_product_categories_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_images" ADD CONSTRAINT "tbl_product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductCategory" ADD CONSTRAINT "_ProductToProductCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "tbl_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductCategory" ADD CONSTRAINT "_ProductToProductCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "tbl_product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductAttribute" ADD CONSTRAINT "_ProductToProductAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "tbl_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductAttribute" ADD CONSTRAINT "_ProductToProductAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "tbl_product_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
