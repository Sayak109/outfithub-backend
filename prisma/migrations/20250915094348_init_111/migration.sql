/*
  Warnings:

  - Added the required column `path` to the `tbl_menu` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."tbl_menu_id_menu_type_id_menu_item_id_idx";

-- AlterTable
ALTER TABLE "public"."tbl_menu" ADD COLUMN     "path" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "tbl_menu_id_menu_type_id_menu_item_id_path_idx" ON "public"."tbl_menu"("id", "menu_type_id", "menu_item_id", "path");
