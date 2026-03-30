/*
  Warnings:

  - The `source` column on the `tbl_live ` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source` column on the `tbl_reels ` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Source" AS ENUM ('INAPP', 'YOUTUBE', 'FACEBOOK');

-- AlterTable
ALTER TABLE "tbl_live " DROP COLUMN "source",
ADD COLUMN     "source" "Source";

-- AlterTable
ALTER TABLE "tbl_reels " DROP COLUMN "source",
ADD COLUMN     "source" "Source";

-- DropEnum
DROP TYPE "LiveSource";
