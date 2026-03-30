/*
  Warnings:

  - Made the column `limit` on table `tbl_otp` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_otp" ALTER COLUMN "limit" SET NOT NULL;
