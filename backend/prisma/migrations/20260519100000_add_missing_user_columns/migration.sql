-- Add missing columns to users table

DO $$
BEGIN
  -- Add department column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'department'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "department" TEXT;
  END IF;

  -- Add jurisdictionArea column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'jurisdictionArea'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "jurisdictionArea" TEXT;
  END IF;

  -- Add officerCode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'officerCode'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "officerCode" TEXT;
  END IF;
END $$;

-- Create unique index on officerCode if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "users_officerCode_key" ON "users"("officerCode");
