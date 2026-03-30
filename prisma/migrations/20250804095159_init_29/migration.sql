-- CreateTable
CREATE TABLE "tbl_liked_reels " (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reel_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_liked_reels _pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_liked_reels " ADD CONSTRAINT "tbl_liked_reels _user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_liked_reels " ADD CONSTRAINT "tbl_liked_reels _reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "tbl_reels "("id") ON DELETE RESTRICT ON UPDATE CASCADE;
