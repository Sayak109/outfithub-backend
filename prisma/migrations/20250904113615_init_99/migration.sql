-- DropForeignKey
ALTER TABLE "public"."tbl_support_ticket" DROP CONSTRAINT "tbl_support_ticket_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."tbl_support_ticket" ADD COLUMN     "email" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."tbl_support_ticket" ADD CONSTRAINT "tbl_support_ticket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
