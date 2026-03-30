-- CreateTable
CREATE TABLE "public"."tbl_menu_types" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_menu" (
    "id" BIGSERIAL NOT NULL,
    "menu_type_id" BIGINT NOT NULL,
    "menu_item_id" BIGINT NOT NULL,
    "menu_item_type" TEXT NOT NULL,
    "display_rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_menu_types_slug_key" ON "public"."tbl_menu_types"("slug");

-- CreateIndex
CREATE INDEX "tbl_menu_types_id_idx" ON "public"."tbl_menu_types"("id");

-- CreateIndex
CREATE INDEX "tbl_menu_id_menu_type_id_menu_item_id_idx" ON "public"."tbl_menu"("id", "menu_type_id", "menu_item_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_menu" ADD CONSTRAINT "tbl_menu_menu_type_id_fkey" FOREIGN KEY ("menu_type_id") REFERENCES "public"."tbl_menu_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
