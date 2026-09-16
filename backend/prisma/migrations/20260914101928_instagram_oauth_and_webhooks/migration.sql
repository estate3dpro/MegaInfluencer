-- CreateEnum
CREATE TYPE "InstagramConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InstagramOAuthFlow" AS ENUM ('LOGIN', 'CONNECT');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InstagramConnection" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "InstagramConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramOAuthState" (
    "id" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "flow" "InstagramOAuthFlow" NOT NULL,
    "influencerId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramLoginTicket" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramLoginTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramWebhookDelivery" (
    "id" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConnection_influencerId_key" ON "InstagramConnection"("influencerId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConnection_instagramUserId_key" ON "InstagramConnection"("instagramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramOAuthState_stateHash_key" ON "InstagramOAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "InstagramOAuthState_expiresAt_idx" ON "InstagramOAuthState"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramLoginTicket_codeHash_key" ON "InstagramLoginTicket"("codeHash");

-- CreateIndex
CREATE INDEX "InstagramLoginTicket_expiresAt_idx" ON "InstagramLoginTicket"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramWebhookDelivery_payloadHash_key" ON "InstagramWebhookDelivery"("payloadHash");

-- AddForeignKey
ALTER TABLE "InstagramConnection" ADD CONSTRAINT "InstagramConnection_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramOAuthState" ADD CONSTRAINT "InstagramOAuthState_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramLoginTicket" ADD CONSTRAINT "InstagramLoginTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
