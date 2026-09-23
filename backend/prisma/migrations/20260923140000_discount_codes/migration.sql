-- Create the persistent store discount-code table. This belongs in a migration,
-- rather than being created on-demand by a request handler.
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "creatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "totalSavings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscountCode_organizationId_code_key" ON "DiscountCode"("organizationId", "code");
CREATE INDEX "DiscountCode_organizationId_status_idx" ON "DiscountCode"("organizationId", "status");
CREATE INDEX "DiscountCode_creatorId_idx" ON "DiscountCode"("creatorId");

ALTER TABLE "DiscountCode"
  ADD CONSTRAINT "DiscountCode_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscountCode"
  ADD CONSTRAINT "DiscountCode_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
