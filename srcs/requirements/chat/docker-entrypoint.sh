#!/bin/sh

# Wait for database to be ready (Optional but recommended)
echo "Running database migrations..."
npx prisma migrate deploy --schema=./packages/database/schema.prisma

echo "Starting server..."
node dist/server.js