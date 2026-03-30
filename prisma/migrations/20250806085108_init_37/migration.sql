/*
  Warnings:

  - The values [RESENTLYVIEWPRODUCT] on the enum `WishListType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WishListType_new" AS ENUM ('WISHLIST', 'SAVEFORLATER', 'RECENTLYVIEWPRODUCTS');
ALTER TABLE "tbl_user_wish_lists" ALTER COLUMN "list_type" TYPE "WishListType_new" USING ("list_type"::text::"WishListType_new");
ALTER TYPE "WishListType" RENAME TO "WishListType_old";
ALTER TYPE "WishListType_new" RENAME TO "WishListType";
DROP TYPE "WishListType_old";
COMMIT;
