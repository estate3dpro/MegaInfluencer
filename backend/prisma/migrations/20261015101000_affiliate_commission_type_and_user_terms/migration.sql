-- AlterTable AffiliateLink
ALTER TABLE "AffiliateLink"
  ADD COLUMN IF NOT EXISTS "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(10, 2);

-- AlterTable AffiliateCommission
ALTER TABLE "AffiliateCommission"
  ADD COLUMN IF NOT EXISTS "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
