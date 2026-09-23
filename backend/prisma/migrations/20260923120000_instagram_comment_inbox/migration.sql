CREATE TYPE "InstagramManualReplyStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "InstagramCommentConversation" (
  "id" TEXT NOT NULL,
  "influencerId" TEXT NOT NULL,
  "instagramCommentId" TEXT NOT NULL,
  "commenterId" TEXT NOT NULL,
  "commenterUsername" TEXT,
  "commentText" TEXT NOT NULL,
  "instagramMediaId" TEXT NOT NULL,
  "instagramAccountId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstagramCommentConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramManualReply" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "senderRole" "UserRole" NOT NULL,
  "message" TEXT NOT NULL,
  "status" "InstagramManualReplyStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstagramManualReply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramCommentConversation_instagramCommentId_key" ON "InstagramCommentConversation"("instagramCommentId");
CREATE INDEX "InstagramCommentConversation_influencerId_updatedAt_idx" ON "InstagramCommentConversation"("influencerId", "updatedAt");
CREATE INDEX "InstagramCommentConversation_instagramMediaId_idx" ON "InstagramCommentConversation"("instagramMediaId");
CREATE INDEX "InstagramManualReply_conversationId_createdAt_idx" ON "InstagramManualReply"("conversationId", "createdAt");
CREATE INDEX "InstagramManualReply_senderUserId_createdAt_idx" ON "InstagramManualReply"("senderUserId", "createdAt");
ALTER TABLE "InstagramCommentConversation" ADD CONSTRAINT "InstagramCommentConversation_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramManualReply" ADD CONSTRAINT "InstagramManualReply_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "InstagramCommentConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramManualReply" ADD CONSTRAINT "InstagramManualReply_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve comment context already recorded by existing automations, so the
-- inbox is useful immediately after deployment instead of only for new hooks.
INSERT INTO "InstagramCommentConversation" (
  "id", "influencerId", "instagramCommentId", "commenterId", "commenterUsername", "commentText", "instagramMediaId", "createdAt", "updatedAt"
)
SELECT
  'legacy_' || delivery."id",
  automation."influencerId",
  delivery."commentId",
  delivery."commenterId",
  delivery."commenterName",
  delivery."commentText",
  automation."instagramPostId",
  delivery."createdAt",
  delivery."updatedAt"
FROM "InstagramAutomationDelivery" AS delivery
INNER JOIN "InstagramAutomation" AS automation ON automation."id" = delivery."automationId"
ON CONFLICT ("instagramCommentId") DO NOTHING;
