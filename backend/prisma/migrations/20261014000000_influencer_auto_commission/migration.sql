-- Add influencer-wise autoCommission switch to StoreInfluencerAssignment
ALTER TABLE "StoreInfluencerAssignment"
ADD COLUMN IF NOT EXISTS "autoCommission" BOOLEAN NOT NULL DEFAULT true;
