-- AlterTable
ALTER TABLE "public"."tbl_menu" ADD COLUMN     "status_id" BIGINT NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "public"."tbl_menu" ADD CONSTRAINT "tbl_menu_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."tbl_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
