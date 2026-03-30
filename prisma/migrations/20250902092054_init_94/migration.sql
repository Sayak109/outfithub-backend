-- CreateTable
CREATE TABLE "tbl_support_ticket" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attechments" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_support_ticket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_support_ticket" ADD CONSTRAINT "tbl_support_ticket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
