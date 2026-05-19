CREATE TABLE IF NOT EXISTS "complaints" (
  "id" TEXT NOT NULL,
  "grievanceId" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "reporterName" TEXT NOT NULL,
  "reporterEmail" TEXT,
  "reporterMobile" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "landmark" TEXT,
  "pincode" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Submitted',
  "publicVisibility" BOOLEAN NOT NULL DEFAULT true,
  "suggestedOfficerId" TEXT,
  "suggestedOfficerName" TEXT,
  "assignedOfficerId" TEXT,
  "assignedOfficerName" TEXT,
  "assignedDepartment" TEXT,
  "assignedArea" TEXT,
  "evidence" JSONB,
  "timeline" JSONB,
  "resolutionSummary" TEXT,
  "resolutionEvidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "officer_invitations" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "username" TEXT,
  "department" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'officer',
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "invitedById" TEXT,
  "acceptedById" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "officer_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "complaints_grievanceId_key" ON "complaints"("grievanceId");
CREATE INDEX IF NOT EXISTS "complaints_status_idx" ON "complaints"("status");
CREATE INDEX IF NOT EXISTS "complaints_department_idx" ON "complaints"("department");
CREATE INDEX IF NOT EXISTS "complaints_district_idx" ON "complaints"("district");
CREATE INDEX IF NOT EXISTS "complaints_assignedOfficerId_idx" ON "complaints"("assignedOfficerId");

CREATE UNIQUE INDEX IF NOT EXISTS "officer_invitations_code_key" ON "officer_invitations"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "officer_invitations_email_key" ON "officer_invitations"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "officer_invitations_username_key" ON "officer_invitations"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "officer_invitations_acceptedById_key" ON "officer_invitations"("acceptedById");
CREATE INDEX IF NOT EXISTS "officer_invitations_status_idx" ON "officer_invitations"("status");
CREATE INDEX IF NOT EXISTS "officer_invitations_email_idx" ON "officer_invitations"("email");
CREATE INDEX IF NOT EXISTS "officer_invitations_department_idx" ON "officer_invitations"("department");

DO $$
BEGIN
  ALTER TABLE "complaints"
    ADD CONSTRAINT "complaints_reporterUserId_fkey"
    FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "complaints"
    ADD CONSTRAINT "complaints_assignedOfficerId_fkey"
    FOREIGN KEY ("assignedOfficerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "officer_invitations"
    ADD CONSTRAINT "officer_invitations_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "officer_invitations"
    ADD CONSTRAINT "officer_invitations_acceptedById_fkey"
    FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
