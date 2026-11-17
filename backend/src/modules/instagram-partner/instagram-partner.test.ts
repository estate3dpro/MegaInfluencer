import { createHmac } from 'node:crypto';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildTestApp } from '../../test/app.js';
import { config } from '../../config/env.js';
import { verifyMetaWebhookSignature } from './instagram-partner.routes.js';

describe('Instagram Partner Automation Engine & External APIs', () => {
  let app: FastifyInstance;
  const testTenantId = `test_tenant_${Date.now()}`;
  const apiKey = config.partnerApiKey || 'megachat_partner_secret_key';

  beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    // Clean up test data if created
    try {
      const account = await app.prisma.instagramAccount.findUnique({
        where: { tenantOrUserId: testTenantId },
      });
      if (account) {
        await app.prisma.instagramAccount.delete({
          where: { id: account.id },
        });
      }
    } catch {
      // Ignore cleanup error
    }
    await app.close();
  });

  describe('Partner Authentication (x-api-key)', () => {
    it('rejects requests without x-api-key header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/status?tenantId=${testTenantId}`,
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error?.code).toBe('UNAUTHORIZED');
    });

    it('rejects requests with an incorrect x-api-key', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/status?tenantId=${testTenantId}`,
        headers: {
          'x-api-key': 'wrong_api_key',
        },
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error?.code).toBe('UNAUTHORIZED');
    });

    it('allows requests with the valid x-api-key', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/status?tenantId=${testTenantId}`,
        headers: {
          'x-api-key': apiKey,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.connected).toBe(false);
      expect(body.activeRulesCount).toBe(0);
    });
  });

  describe('Connect URL & Account Connection', () => {
    it('generates Meta OAuth connect dialog URL with proper scopes and state', async () => {
      const redirectUri = 'https://megachat.example.com/oauth/callback';
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/connect-url?tenantId=${testTenantId}&redirectUri=${encodeURIComponent(
          redirectUri
        )}`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.url).toBeDefined();
      expect(body.url).toContain('https://www.facebook.com/v21.0/dialog/oauth');
      expect(body.url).toContain('instagram_business_manage_comments');
      expect(body.url).toContain('instagram_manage_messages');
    });

    it('connects an account directly and reports active status', async () => {
      const connectRes = await app.inject({
        method: 'POST',
        url: '/api/v1/external/instagram/connect-account',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        payload: {
          tenantId: testTenantId,
          instagramBusinessAccountId: `ig_biz_${Date.now()}`,
          username: 'partner_test_brand',
          accessToken: 'EAAB_test_page_access_token_mock',
          profilePictureUrl: 'https://example.com/brand-avatar.png',
        },
      });

      expect(connectRes.statusCode).toBe(200);
      const connectBody = JSON.parse(connectRes.body);
      expect(connectBody.success).toBe(true);
      expect(connectBody.account.username).toBe('partner_test_brand');

      // Verify status now reports connected: true
      const statusRes = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/status?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });
      const statusBody = JSON.parse(statusRes.body);
      expect(statusBody.connected).toBe(true);
      expect(statusBody.username).toBe('partner_test_brand');
      expect(statusBody.activeRulesCount).toBe(0);
    });
  });

  describe('Rules Management CRUD', () => {
    let createdRuleId: string;

    it('creates a new comment automation rule', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/external/instagram/rules',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        payload: {
          tenantId: testTenantId,
          targetPostId: 'ALL_POSTS',
          postCaption: 'Summer Collection Drop',
          postThumbnail: 'https://example.com/thumb.jpg',
          matchType: 'CONTAINS',
          keywords: ['PRICE', 'LINK', 'BUY'],
          publicReplies: ['Sent you a DM! 📩', 'Check your inbox! ✨'],
          dmMessage: 'Here is the link you requested: {{link}}!',
          linkUrl: 'https://store.example.com/item/123',
          isActive: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.rule.id).toBeDefined();
      expect(body.rule.matchType).toBe('CONTAINS');
      expect(body.rule.keywords).toEqual(['PRICE', 'LINK', 'BUY']);
      expect(body.rule.publicReplies).toHaveLength(2);
      createdRuleId = body.rule.id;
    });

    it('lists rules configured for the tenant', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/rules?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.rules)).toBe(true);
      expect(body.rules.length).toBeGreaterThanOrEqual(1);
      const found = body.rules.find((r: any) => r.id === createdRuleId);
      expect(found).toBeDefined();
    });

    it('updates an existing rule', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/external/instagram/rules',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        payload: {
          tenantId: testTenantId,
          ruleId: createdRuleId,
          targetPostId: 'ALL_POSTS',
          matchType: 'EXACT',
          keywords: ['PRICE'],
          dmMessage: 'Updated DM: {{link}}',
          linkUrl: 'https://store.example.com/new-link',
          isActive: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.rule.matchType).toBe('EXACT');
      expect(body.rule.keywords).toEqual(['PRICE']);
    });

    it('deletes the rule', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/external/instagram/rules/${createdRuleId}?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);

      // Verify rule list is now empty
      const listRes = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/rules?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });
      const listBody = JSON.parse(listRes.body);
      const found = listBody.rules.find((r: any) => r.id === createdRuleId);
      expect(found).toBeUndefined();
    });
  });

  describe('Meta Inbound Webhook Listener', () => {
    const verifyToken = config.metaInstagramVerifyToken || config.webhookVerifyToken || 'mega-influencer-verify-token';
    const appSecret = config.metaAppSecret || config.instagramAppSecret || '9bd73cf67535687936a66289370e9127';

    it('verifies Meta webhook handshake via GET /api/webhooks/instagram', async () => {
      const challenge = 'challenge_test_string_xyz_789';
      const res = await app.inject({
        method: 'GET',
        url: `/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          verifyToken
        )}&hub.challenge=${encodeURIComponent(challenge)}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(challenge);
      expect(res.headers['content-type']).toContain('text/plain');
    });

    it('rejects GET verification if verify_token is invalid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=invalid_token&hub.challenge=test',
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates HMAC-SHA256 signature helper correctly', () => {
      const rawPayload = Buffer.from(JSON.stringify({ object: 'instagram', entry: [] }));
      const validHmac = createHmac('sha256', appSecret).update(rawPayload).digest('hex');
      const validHeader = `sha256=${validHmac}`;

      expect(verifyMetaWebhookSignature(rawPayload, validHeader)).toBe(true);
      expect(verifyMetaWebhookSignature(rawPayload, 'sha256=invalid_hex_signature')).toBe(false);
      expect(verifyMetaWebhookSignature(rawPayload, undefined)).toBe(false);
    });

    it('accepts signed webhook event via POST /api/webhooks/instagram and responds immediately', async () => {
      const payloadObj = {
        object: 'instagram',
        entry: [
          {
            id: '178414000000000',
            time: 1731750000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: `comment_${Date.now()}`,
                  text: 'What is the price?',
                  from: { id: 'user_123', username: 'shopper_jane' },
                  media: { id: 'media_456' },
                },
              },
            ],
          },
        ],
      };

      const rawPayload = Buffer.from(JSON.stringify(payloadObj), 'utf8');
      const hmac = createHmac('sha256', appSecret).update(rawPayload).digest('hex');

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/instagram',
        headers: {
          'x-hub-signature-256': `sha256=${hmac}`,
          'content-type': 'application/json',
        },
        payload: rawPayload,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.received).toBe(true);
    });
  });

  describe('Analytics & Execution Logs', () => {
    it('returns empty/zero analytics summary when no stats exist', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/analytics?tenantId=${testTenantId}&days=30`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.summary).toBeDefined();
      expect(body.summary.totalComments).toBeDefined();
      expect(body.summary.deliverySuccessRate).toBeDefined();
      expect(Array.isArray(body.dailyTrends)).toBe(true);
      expect(Array.isArray(body.topRules)).toBe(true);
    });

    it('returns paginated execution logs structure', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/logs?tenantId=${testTenantId}&page=1&limit=10`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
      expect(typeof body.total).toBe('number');
      expect(typeof body.totalPages).toBe('number');
    });
  });

  describe('Two-Way Direct Messaging & Chat Conversations', () => {
    let testConversationId: string;
    const customerParticipantId = `cust_${Date.now()}`;

    it('ingests an inbound direct message webhook and creates a conversation thread', async () => {
      // Find account to get its business account id
      const account = await app.prisma.instagramAccount.findUnique({
        where: { tenantOrUserId: testTenantId },
      });
      expect(account).toBeDefined();

      const webhookPayload = {
        object: 'instagram',
        entry: [
          {
            id: account!.instagramBusinessAccountId,
            time: Date.now(),
            messaging: [
              {
                sender: { id: customerParticipantId, username: 'customer_alice' },
                recipient: { id: account!.instagramBusinessAccountId },
                timestamp: Date.now(),
                message: {
                  mid: `mid_${Date.now()}`,
                  text: 'Hi! Do you have this in size M?',
                },
              },
            ],
          },
        ],
      };

      const raw = Buffer.from(JSON.stringify(webhookPayload));
      const appSecret = config.metaAppSecret || config.instagramAppSecret || '9bd73cf67535687936a66289370e9127';
      const hmac = createHmac('sha256', appSecret).update(raw).digest('hex');

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/instagram',
        headers: {
          'x-hub-signature-256': `sha256=${hmac}`,
          'content-type': 'application/json',
        },
        payload: raw,
      });

      expect(res.statusCode).toBe(200);

      // Verify conversation was created
      const convRes = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/conversations?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });

      expect(convRes.statusCode).toBe(200);
      const convBody = JSON.parse(convRes.body);
      expect(convBody.items.length).toBeGreaterThanOrEqual(1);

      const conv = convBody.items.find((c: any) => c.participantId === customerParticipantId);
      expect(conv).toBeDefined();
      expect(conv.participantUsername).toBe('customer_alice');
      expect(conv.isWindowOpen).toBe(true);
      expect(conv.lastMessage?.messageText).toBe('Hi! Do you have this in size M?');
      testConversationId = conv.id;
    });

    it('lists message history for the conversation', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/external/instagram/conversations/${testConversationId}/messages?tenantId=${testTenantId}`,
        headers: { 'x-api-key': apiKey },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.conversation).toBeDefined();
      expect(body.conversation.participantId).toBe(customerParticipantId);
      expect(body.conversation.isWindowOpen).toBe(true);
      expect(body.messages.length).toBeGreaterThanOrEqual(1);
      expect(body.messages[0].direction).toBe('INBOUND');
      expect(body.messages[0].messageText).toBe('Hi! Do you have this in size M?');
    });

    it('sends an outbound direct message reply via Meta Graph API', async () => {
      // Mock global fetch for Meta API
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (url: any, init: any) => {
        if (typeof url === 'string' && url.includes('messages')) {
          return new Response(JSON.stringify({ recipient_id: customerParticipantId, message_id: `mid_outbound_${Date.now()}_${Math.random().toString(36).slice(2)}` }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return originalFetch(url, init);
      }) as any;

      try {
        const sendRes = await app.inject({
          method: 'POST',
          url: `/api/v1/external/instagram/conversations/${testConversationId}/messages`,
          headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
          },
          payload: {
            tenantId: testTenantId,
            messageText: 'Yes, size M is currently in stock!',
          },
        });

        expect(sendRes.statusCode).toBe(200);
        const sendBody = JSON.parse(sendRes.body);
        expect(sendBody.success).toBe(true);
        expect(sendBody.message.direction).toBe('OUTBOUND');
        expect(sendBody.message.messageText).toBe('Yes, size M is currently in stock!');

        // Verify message shows in message history
        const listRes = await app.inject({
          method: 'GET',
          url: `/api/v1/external/instagram/conversations/${testConversationId}/messages?tenantId=${testTenantId}`,
          headers: { 'x-api-key': apiKey },
        });
        const listBody = JSON.parse(listRes.body);
        expect(listBody.messages.length).toBe(2);
        expect(listBody.messages[1].direction).toBe('OUTBOUND');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('sends direct message to recipient directly via /messages/send', async () => {
      const originalFetch = globalThis.fetch;
      const newRecipientId = `cust_new_${Date.now()}`;
      globalThis.fetch = (async (url: any, init: any) => {
        if (typeof url === 'string' && url.includes('messages')) {
          return new Response(JSON.stringify({ recipient_id: newRecipientId, message_id: `mid_direct_${Date.now()}_${Math.random().toString(36).slice(2)}` }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return originalFetch(url, init);
      }) as any;

      try {
        const sendRes = await app.inject({
          method: 'POST',
          url: '/api/v1/external/instagram/messages/send',
          headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
          },
          payload: {
            tenantId: testTenantId,
            recipientId: newRecipientId,
            messageText: 'Special offer just for you!',
          },
        });

        expect(sendRes.statusCode).toBe(200);
        const sendBody = JSON.parse(sendRes.body);
        expect(sendBody.success).toBe(true);
        expect(sendBody.conversationId).toBeDefined();
        expect(sendBody.message.direction).toBe('OUTBOUND');
        expect(sendBody.message.messageText).toBe('Special offer just for you!');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

