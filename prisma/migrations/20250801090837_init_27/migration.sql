/*
  Warnings:

  - Added the required column `source` to the `tbl_live ` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LiveSource" AS ENUM ('INAPP', 'YOUTUBE', 'FACEBOOK');

-- AlterTable
ALTER TABLE "tbl_live " ADD COLUMN     "facebookLink" TEXT,
ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "hostname" TEXT,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "source" "LiveSource" NOT NULL,
ADD COLUMN     "streamId" TEXT,
ADD COLUMN     "youtubeLink" TEXT,
ALTER COLUMN "views" SET DEFAULT 0,
ALTER COLUMN "views" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "tbl_reels " ADD COLUMN     "likes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0;
