-- CreateTable "officer_locations"
CREATE TABLE "officer_locations" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "etaMinutes" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officer_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "officer_locations_officerId_idx" ON "officer_locations"("officerId");

-- CreateIndex
CREATE INDEX "officer_locations_complaintId_idx" ON "officer_locations"("complaintId");

-- CreateIndex
CREATE INDEX "officer_locations_officerId_complaintId_idx" ON "officer_locations"("officerId", "complaintId");

-- CreateIndex
CREATE INDEX "officer_locations_updatedAt_idx" ON "officer_locations"("updatedAt");

-- CreateIndex
CREATE INDEX "officer_locations_isActive_idx" ON "officer_locations"("isActive");

-- AddForeignKey
ALTER TABLE "officer_locations" ADD CONSTRAINT "officer_locations_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officer_locations" ADD CONSTRAINT "officer_locations_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
