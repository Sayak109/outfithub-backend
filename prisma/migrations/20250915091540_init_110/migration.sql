-- AlterTable
ALTER TABLE "public"."tbl_menu_types" ADD COLUMN     "parent_menu_type" BIGINT;

-- AddForeignKey
ALTER TABLE "public"."tbl_menu_types" ADD CONSTRAINT "tbl_menu_types_parent_menu_type_fkey" FOREIGN KEY ("parent_menu_type") REFERENCES "public"."tbl_menu_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
