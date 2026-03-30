-- CreateTable
CREATE TABLE "tbl_blocked_keywords" (
    "id" BIGSERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_blocked_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_blocked_keywords_keyword_idx" ON "tbl_blocked_keywords"("keyword");
