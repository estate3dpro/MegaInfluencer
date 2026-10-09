-- Keep visit attribution for every tracking link, including store-owned links
-- that have no creator and therefore never create a commission row.
ALTER TABLE "ShopifyOrder"
  ADD COLUMN IF NOT EXISTS "affiliateLinkId" TEXT;

CREATE INDEX IF NOT EXISTS "ShopifyOrder_affiliateLinkId_idx"
  ON "ShopifyOrder"("affiliateLinkId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ShopifyOrder_affiliateLinkId_fkey'
  ) THEN
    ALTER TABLE "ShopifyOrder"
      ADD CONSTRAINT "ShopifyOrder_affiliateLinkId_fkey"
      FOREIGN KEY ("affiliateLinkId")
      REFERENCES "AffiliateLink"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
