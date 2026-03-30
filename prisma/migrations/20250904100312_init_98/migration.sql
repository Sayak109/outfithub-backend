-- AlterTable
ALTER TABLE "public"."tbl_reels " ADD COLUMN     "desc" TEXT;

-- CreateTable
CREATE TABLE "public"."tbl_tags" (
    "id" BIGSERIAL NOT NULL,
    "reel_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,

    CONSTRAINT "tbl_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_hashtags" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tags_reel_id_tag_id_key" ON "public"."tbl_tags"("reel_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_hashtags_name_key" ON "public"."tbl_hashtags"("name");

-- AddForeignKey
ALTER TABLE "public"."tbl_tags" ADD CONSTRAINT "tbl_tags_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "public"."tbl_reels "("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_tags" ADD CONSTRAINT "tbl_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tbl_hashtags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
