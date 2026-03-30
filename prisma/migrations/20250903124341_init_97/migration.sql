-- CreateTable
CREATE TABLE "public"."tbl_dynamic_pages" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_dynamic_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_slug_key" ON "public"."tbl_dynamic_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_id_key" ON "public"."tbl_dynamic_pages"("id");
