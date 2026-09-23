CREATE TYPE "InstagramDirectMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

CREATE TABLE "InstagramDirectConversation" (
  "id" TEXT NOT NULL,
  "influencerId" TEXT NOT NULL,
  "instagramParticipantId" TEXT NOT NULL,
  "participantUsername" TEXT,
  "instagramAccountId" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstagramDirectConversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InstagramDirectMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "instagramMessageId" TEXT,
  "senderUserId" TEXT,
  "direction" "InstagramDirectMessageDirection" NOT NULL,
  "messageText" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstagramDirectMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InstagramDirectConversation_influencerId_instagramParticipantId_key" ON "InstagramDirectConversation"("influencerId", "instagramParticipantId");
CREATE INDEX "InstagramDirectConversation_influencerId_lastMessageAt_idx" ON "InstagramDirectConversation"("influencerId", "lastMessageAt");
CREATE UNIQUE INDEX "InstagramDirectMessage_instagramMessageId_key" ON "InstagramDirectMessage"("instagramMessageId");
CREATE INDEX "InstagramDirectMessage_conversationId_sentAt_idx" ON "InstagramDirectMessage"("conversationId", "sentAt");
ALTER TABLE "InstagramDirectConversation" ADD CONSTRAINT "InstagramDirectConversation_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramDirectMessage" ADD CONSTRAINT "InstagramDirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "InstagramDirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramDirectMessage" ADD CONSTRAINT "InstagramDirectMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
