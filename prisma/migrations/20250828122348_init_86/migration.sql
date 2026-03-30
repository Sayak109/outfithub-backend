/*
  Warnings:

  - You are about to drop the column `anwser` on the `tbl_faqs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tbl_faqs_id_question_anwser_rank_status_id_idx";

-- AlterTable
ALTER TABLE "tbl_faqs" DROP COLUMN "anwser",
ADD COLUMN     "answer" TEXT;

-- CreateIndex
CREATE INDEX "tbl_faqs_id_question_answer_rank_status_id_idx" ON "tbl_faqs"("id", "question", "answer", "rank", "status_id");
