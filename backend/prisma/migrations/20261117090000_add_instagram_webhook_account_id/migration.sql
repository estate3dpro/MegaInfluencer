-- Meta's Instagram Login account ID can differ from the business account ID
-- delivered by Instagram messaging webhooks. Keep both IDs on the connection.
ALTER TABLE "InstagramConnection"
ADD COLUMN "webhookInstagramAccountId" TEXT;

CREATE UNIQUE INDEX "InstagramConnection_webhookInstagramAccountId_key"
ON "InstagramConnection"("webhookInstagramAccountId");
