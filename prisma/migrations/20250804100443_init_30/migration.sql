/*
  Warnings:

  - A unique constraint covering the columns `[user_id,reel_id]` on the table `tbl_liked_reels ` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_liked_reels _user_id_reel_id_key" ON "tbl_liked_reels "("user_id", "reel_id");
