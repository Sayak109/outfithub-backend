#!/bin/sh
set -e

echo "Waiting for Postgres..."
until pg_isready -h postgres -p 5432 -U fff; do
  sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running Prisma seed..."
npx prisma db seed || true

exec "$@"