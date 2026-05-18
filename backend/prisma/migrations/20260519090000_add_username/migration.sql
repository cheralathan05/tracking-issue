-- Migration: add username column to users and a unique index

DO $$
BEGIN
  ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "username" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
