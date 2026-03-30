/*
  Warnings:

  - Made the column `answer` on table `tbl_faqs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_faqs" ALTER COLUMN "answer" SET NOT NULL;
