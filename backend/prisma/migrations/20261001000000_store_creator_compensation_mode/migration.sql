-- Temporary creator-level compensation setting. Existing partnerships remain commission-based.
ALTER TABLE "StoreInfluencerAssignment"
ADD COLUMN IF NOT EXISTS "compensationMode" TEXT NOT NULL DEFAULT 'COMMISSION';

ALTER TABLE "StoreInfluencerAssignment"
ADD CONSTRAINT "StoreInfluencerAssignment_compensationMode_check"
CHECK ("compensationMode" IN ('COMMISSION', 'BARTER'));
