-- CreateTable
CREATE TABLE "tbl_addresses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "address_type" "AddressType" NOT NULL,
    "metadata" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_search_queries" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_recent_searches" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "searchQuery_id" BIGINT NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_recent_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_addresses_user_id_idx" ON "tbl_addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_search_queries_query_key" ON "tbl_search_queries"("query");

-- CreateIndex
CREATE INDEX "tbl_search_queries_query_idx" ON "tbl_search_queries"("query");

-- CreateIndex
CREATE INDEX "tbl_recent_searches_user_id_searched_at_idx" ON "tbl_recent_searches"("user_id", "searched_at");

-- AddForeignKey
ALTER TABLE "tbl_addresses" ADD CONSTRAINT "tbl_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_recent_searches" ADD CONSTRAINT "tbl_recent_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_recent_searches" ADD CONSTRAINT "tbl_recent_searches_searchQuery_id_fkey" FOREIGN KEY ("searchQuery_id") REFERENCES "tbl_search_queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
