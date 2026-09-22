-- Store tracking links do not belong to a creator. Their attributed orders are
-- retained in AffiliateCommission so existing reporting can count order value.
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_creatorId_fkey";
ALTER TABLE "AffiliateLink" DROP CONSTRAINT "AffiliateLink_creatorId_fkey";

ALTER TABLE "AffiliateLink" ALTER COLUMN "creatorId" DROP NOT NULL;
ALTER TABLE "AffiliateCommission" ALTER COLUMN "creatorId" DROP NOT NULL;

ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
