-- Let individual automation rules optionally send again when Meta redelivers
-- the exact same comment webhook. Existing rules keep the safe default.
ALTER TABLE "InstagramAutomation"
ADD COLUMN "replyOnDuplicateCommentWebhook" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the existing idempotency key for historical deliveries, then make
-- room for an explicit repeat-delivery attempt key.
ALTER TABLE "InstagramAutomationDelivery"
ADD COLUMN "attemptKey" TEXT;

UPDATE "InstagramAutomationDelivery"
SET "attemptKey" = "commentId";

ALTER TABLE "InstagramAutomationDelivery"
ALTER COLUMN "attemptKey" SET NOT NULL;

DROP INDEX "InstagramAutomationDelivery_automationId_commentId_key";

CREATE UNIQUE INDEX "InstagramAutomationDelivery_automationId_attemptKey_key"
ON "InstagramAutomationDelivery"("automationId", "attemptKey");

CREATE INDEX "InstagramAutomationDelivery_automationId_commentId_idx"
ON "InstagramAutomationDelivery"("automationId", "commentId");
