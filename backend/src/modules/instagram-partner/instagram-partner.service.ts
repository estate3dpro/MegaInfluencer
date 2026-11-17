import type { FastifyInstance } from 'fastify';

import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken, encryptToken } from '../instagram/instagram.crypto.js';
import {
  buildMetaOAuthDialogUrl,
  exchangeOAuthCodeForInstagramAccount,
  fetchInstagramMedia,
  postPublicCommentReply,
  sendPrivateCommentReply,
  sendMetaDirectMessage,
} from './meta-graph.client.js';

export interface UpsertRuleInput {
  tenantId: string;
  ruleId?: string;
  targetPostId: string;
  postCaption?: string;
  postThumbnail?: string;
  matchType: 'ANY' | 'EXACT' | 'CONTAINS' | 'REGEX' | string;
  keywords?: string[];
  publicReplies?: string[];
  dmMessage: string;
  linkUrl?: string;
  isActive?: boolean;
}

export interface ConnectAccountInput {
  tenantId: string;
  code?: string;
  redirectUri?: string;
  instagramBusinessAccountId?: string;
  username?: string;
  accessToken?: string;
  profilePictureUrl?: string;
}

/**
 * Retrieves the connection status and active rule count for a partner tenant
 */
export async function getPartnerAccountStatus(app: FastifyInstance, tenantId: string) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
    include: {
      _count: {
        select: {
          rules: { where: { isActive: true } },
        },
      },
    },
  });

  if (!account || !account.isActive) {
    return {
      connected: false,
      username: null,
      businessAccountId: null,
      profilePictureUrl: null,
      activeRulesCount: 0,
    };
  }

  return {
    connected: true,
    username: account.username,
    businessAccountId: account.instagramBusinessAccountId,
    profilePictureUrl: account.profilePictureUrl,
    activeRulesCount: account._count.rules,
  };
}

/**
 * Builds the Meta OAuth connect dialog URL for the tenant
 */
export function generatePartnerConnectUrl(tenantId: string, redirectUri: string, scope?: string) {
  if (!tenantId || !redirectUri) {
    throw new AppError('INVALID_PARAMETERS', 'tenantId and redirectUri are required query parameters.', 400);
  }
  const statePayload = Buffer.from(JSON.stringify({ tenantId, redirectUri })).toString('base64url');
  return {
    url: buildMetaOAuthDialogUrl(redirectUri, statePayload, scope),
  };
}

/**
 * Connects an Instagram account for a tenant either via OAuth code or direct credentials
 */
export async function connectPartnerAccount(app: FastifyInstance, input: ConnectAccountInput) {
  const { tenantId } = input;
  if (!tenantId) {
    throw new AppError('INVALID_PARAMETERS', 'tenantId is required.', 400);
  }

  let igBusinessAccountId: string;
  let username: string;
  let pageToken: string;
  let profilePicUrl: string | undefined;

  if (input.code && input.redirectUri) {
    // 1. Exchange OAuth code for Page Token & Account Details
    const result = await exchangeOAuthCodeForInstagramAccount(input.code, input.redirectUri);
    igBusinessAccountId = result.instagramBusinessAccountId;
    username = result.username;
    pageToken = result.pageAccessToken;
    profilePicUrl = result.profilePictureUrl;
  } else if (input.instagramBusinessAccountId && input.username && input.accessToken) {
    // 2. Direct manual connection
    igBusinessAccountId = input.instagramBusinessAccountId;
    username = input.username;
    pageToken = input.accessToken;
    profilePicUrl = input.profilePictureUrl;
  } else {
    throw new AppError(
      'INVALID_PAYLOAD',
      'Provide either (code and redirectUri) or (instagramBusinessAccountId, username, and accessToken).',
      400
    );
  }

  const encryptedToken = encryptToken(pageToken);

  const account = await app.prisma.instagramAccount.upsert({
    where: { tenantOrUserId: tenantId },
    create: {
      tenantOrUserId: tenantId,
      instagramBusinessAccountId: igBusinessAccountId,
      username,
      profilePictureUrl: profilePicUrl,
      accessToken: encryptedToken,
      isActive: true,
    },
    update: {
      instagramBusinessAccountId: igBusinessAccountId,
      username,
      profilePictureUrl: profilePicUrl,
      accessToken: encryptedToken,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  return {
    success: true,
    account: {
      id: account.id,
      tenantId: account.tenantOrUserId,
      username: account.username,
      businessAccountId: account.instagramBusinessAccountId,
      profilePictureUrl: account.profilePictureUrl,
      connectedAt: account.updatedAt,
    },
  };
}

/**
 * Fetches recent reels and posts from Meta Graph API using decrypted Page Token
 */
export async function getPartnerPosts(app: FastifyInstance, tenantId: string, limit: number = 20) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account || !account.isActive) {
    throw new AppError('INSTAGRAM_NOT_CONNECTED', 'No active Instagram account connected for this tenant.', 404);
  }

  const pageToken = decryptToken(account.accessToken);
  const rawPosts = await fetchInstagramMedia(pageToken, account.instagramBusinessAccountId, limit);

  const posts = rawPosts.map((p) => ({
    id: p.id,
    caption: p.caption || '',
    mediaType: p.media_type,
    mediaUrl: p.media_url || null,
    thumbnailUrl: p.thumbnail_url || p.media_url || null,
    permalink: p.permalink || null,
    commentsCount: p.comments_count || 0,
    likeCount: p.like_count || 0,
    timestamp: p.timestamp || null,
  }));

  return { posts };
}

/**
 * Returns all automation rules for a tenant
 */
export async function listPartnerRules(app: FastifyInstance, tenantId: string) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
    include: {
      rules: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!account) {
    return { rules: [] };
  }

  return { rules: account.rules };
}

/**
 * Creates or updates an Instagram Comment Automation Rule
 */
export async function upsertPartnerRule(app: FastifyInstance, input: UpsertRuleInput) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: input.tenantId },
  });

  if (!account) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Instagram account not found for this tenant.', 404);
  }

  const matchType = (input.matchType || 'CONTAINS').toUpperCase();
  if (!['ANY', 'EXACT', 'CONTAINS', 'REGEX'].includes(matchType)) {
    throw new AppError('INVALID_MATCH_TYPE', 'matchType must be one of ANY, EXACT, CONTAINS, REGEX.', 400);
  }

  if (matchType !== 'ANY' && (!input.keywords || input.keywords.length === 0)) {
    throw new AppError('KEYWORDS_REQUIRED', 'At least one keyword is required when matchType is not ANY.', 400);
  }

  if (!input.dmMessage?.trim()) {
    throw new AppError('DM_MESSAGE_REQUIRED', 'dmMessage is required.', 400);
  }

  const targetPostId = input.targetPostId?.trim() || 'ALL_POSTS';
  const keywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean);
  const publicReplies = (input.publicReplies || []).map((r) => r.trim()).filter(Boolean);

  let rule;
  if (input.ruleId) {
    // Update existing rule
    rule = await app.prisma.instagramCommentRule.update({
      where: {
        id: input.ruleId,
        instagramAccountId: account.id,
      },
      data: {
        targetPostId,
        postCaption: input.postCaption,
        postThumbnail: input.postThumbnail,
        matchType,
        keywords,
        publicReplies,
        dmMessage: input.dmMessage,
        linkUrl: input.linkUrl || null,
        isActive: input.isActive ?? true,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new rule
    rule = await app.prisma.instagramCommentRule.create({
      data: {
        instagramAccountId: account.id,
        targetPostId,
        postCaption: input.postCaption,
        postThumbnail: input.postThumbnail,
        matchType,
        keywords,
        publicReplies,
        dmMessage: input.dmMessage,
        linkUrl: input.linkUrl || null,
        isActive: input.isActive ?? true,
      },
    });
  }

  return { success: true, rule };
}

/**
 * Deletes an automation rule
 */
export async function deletePartnerRule(app: FastifyInstance, tenantId: string, ruleId: string) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Instagram account not found for this tenant.', 404);
  }

  await app.prisma.instagramCommentRule.delete({
    where: {
      id: ruleId,
      instagramAccountId: account.id,
    },
  });

  return { success: true };
}

/**
 * Computes performance analytics, delivery success rate, daily trends, and top rules
 */
export async function getPartnerAnalytics(app: FastifyInstance, tenantId: string, days: number = 30) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account) {
    return {
      summary: {
        totalComments: 0,
        matchedComments: 0,
        publicRepliesSent: 0,
        dmsSent: 0,
        deliverySuccessRate: 100,
      },
      dailyTrends: [],
      topRules: [],
    };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.max(1, Math.min(days, 365)));
  const cutoffDateStr = cutoff.toISOString().slice(0, 10);

  // 1. Fetch Daily Stats for the date range
  const stats = await app.prisma.instagramDailyStat.findMany({
    where: {
      instagramAccountId: account.id,
      date: { gte: cutoffDateStr },
    },
    orderBy: { date: 'asc' },
  });

  const totalComments = stats.reduce((acc, s) => acc + s.totalComments, 0);
  const matchedComments = stats.reduce((acc, s) => acc + s.matchedRules, 0);
  const publicRepliesSent = stats.reduce((acc, s) => acc + s.publicRepliesSent, 0);
  const dmsSent = stats.reduce((acc, s) => acc + s.dmsSent, 0);

  const deliverySuccessRate =
    matchedComments > 0
      ? Number(((dmsSent / matchedComments) * 100).toFixed(1))
      : 100;

  const dailyTrends = stats.map((s) => ({
    date: s.date,
    comments: s.totalComments,
    dmsSent: s.dmsSent,
  }));

  // 2. Fetch Top Rules by triggers using logs
  const topLogs = await app.prisma.instagramCommentLog.groupBy({
    by: ['ruleId'],
    where: {
      instagramAccountId: account.id,
      ruleId: { not: null },
      createdAt: { gte: cutoff },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const ruleIds = topLogs.map((l) => l.ruleId).filter((id): id is string => Boolean(id));
  const rules = await app.prisma.instagramCommentRule.findMany({
    where: { id: { in: ruleIds } },
  });
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  const topRules = topLogs
    .filter((l) => l.ruleId && ruleMap.has(l.ruleId))
    .map((l) => {
      const r = ruleMap.get(l.ruleId!)!;
      return {
        ruleId: r.id,
        postCaption: r.postCaption || (r.targetPostId === 'ALL_POSTS' ? 'All Posts' : r.targetPostId),
        triggers: l._count.id,
      };
    });

  return {
    summary: {
      totalComments,
      matchedComments,
      publicRepliesSent,
      dmsSent,
      deliverySuccessRate,
    },
    dailyTrends,
    topRules,
  };
}

/**
 * Returns paginated comment events / execution logs
 */
export async function getPartnerLogs(
  app: FastifyInstance,
  tenantId: string,
  options: { page?: number; limit?: number; ruleId?: string }
) {
  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account) {
    return { items: [], total: 0, page: 1, limit: 25, totalPages: 0 };
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(Number(options.limit) || 25, 100));
  const skip = (page - 1) * limit;

  const whereClause: any = {
    instagramAccountId: account.id,
  };
  if (options.ruleId?.trim()) {
    whereClause.ruleId = options.ruleId.trim();
  }

  const [total, items] = await Promise.all([
    app.prisma.instagramCommentLog.count({ where: whereClause }),
    app.prisma.instagramCommentLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        commentId: true,
        commentText: true,
        commenterUsername: true,
        mediaId: true,
        ruleId: true,
        matchedKeyword: true,
        publicReplyStatus: true,
        publicReplyText: true,
        dmStatus: true,
        dmError: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// -----------------------------------------------------------------------------
// Real-Time Comment Webhook Processing Engine
// -----------------------------------------------------------------------------

export interface CommentWebhookValue {
  id: string; // comment_id
  text: string;
  from?: {
    id: string; // commenter ig user id
    username?: string;
  };
  media?: {
    id: string; // media_id
    media_product_type?: string;
  };
  parent_id?: string;
}

/**
 * Matches a comment's text against an automation rule
 */
function evaluateCommentMatch(
  commentText: string,
  matchType: string,
  keywords: string[]
): { isMatch: boolean; matchedKeyword: string | null } {
  const trimmed = commentText.trim();
  const normalizedText = trimmed.toLowerCase();

  if (matchType === 'ANY') {
    return { isMatch: true, matchedKeyword: '*' };
  }

  for (const kw of keywords) {
    const trimmedKw = kw.trim();
    if (!trimmedKw) continue;

    if (matchType === 'EXACT') {
      if (normalizedText === trimmedKw.toLowerCase()) {
        return { isMatch: true, matchedKeyword: trimmedKw };
      }
    } else if (matchType === 'CONTAINS') {
      // Word boundary or substring match
      const regex = new RegExp(`(^|\\s|[.,!?;])${escapeRegExp(trimmedKw.toLowerCase())}($|\\s|[.,!?;])`, 'i');
      if (regex.test(normalizedText) || normalizedText.includes(trimmedKw.toLowerCase())) {
        return { isMatch: true, matchedKeyword: trimmedKw };
      }
    } else if (matchType === 'REGEX') {
      try {
        const regex = new RegExp(trimmedKw, 'i');
        if (regex.test(trimmed)) {
          return { isMatch: true, matchedKeyword: trimmedKw };
        }
      } catch {
        // Invalid regex keyword ignored
      }
    }
  }

  return { isMatch: false, matchedKeyword: null };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Interpolates variables in the DM message: {{link}}, {{username}}, {{commenter}}
 */
function interpolateDmMessage(template: string, linkUrl: string | null | undefined, commenterUsername: string): string {
  let message = template;
  message = message.replace(/\{\{\s*link\s*\}\}/gi, linkUrl || '');
  message = message.replace(/\{\{\s*username\s*\}\}/gi, commenterUsername || '');
  message = message.replace(/\{\{\s*commenter\s*\}\}/gi, commenterUsername || '');
  return message.trim();
}

/**
 * Process an inbound Instagram comment event across all matching partner accounts & rules
 */
export async function processPartnerCommentWebhook(
  app: FastifyInstance,
  businessAccountId: string,
  commentValue: CommentWebhookValue
) {
  const commentId = commentValue.id;
  const commentText = commentValue.text || '';
  const mediaId = commentValue.media?.id || 'UNKNOWN';
  const commenterId = commentValue.from?.id || '';
  const commenterUsername = commentValue.from?.username || 'user';

  if (!commentId) return { skipped: true, reason: 'NO_COMMENT_ID' };

  // 1. Find connected partner InstagramAccount
  // Match either by instagramBusinessAccountId or find account if single tenant
  const account = await app.prisma.instagramAccount.findFirst({
    where: {
      OR: [
        { instagramBusinessAccountId: businessAccountId },
        { instagramBusinessAccountId: commenterId }, // in case entry.id is page id
      ],
      isActive: true,
    },
    include: {
      rules: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!account) {
    return { skipped: true, reason: 'ACCOUNT_NOT_FOUND_FOR_ENTRY_ID', businessAccountId };
  }

  // 2. Infinite Loop Protection: Never reply to own comments
  if (
    commenterId === account.instagramBusinessAccountId ||
    (account.username && commenterUsername.toLowerCase() === account.username.toLowerCase())
  ) {
    app.log.info({ commentId, commenterUsername }, 'Skipping automation: comment made by own account (loop guard)');
    return { skipped: true, reason: 'OWN_ACCOUNT_COMMENT_LOOP_GUARD' };
  }

  // 3. Duplicate Protection: Check if comment was already logged
  const existingLog = await app.prisma.instagramCommentLog.findUnique({
    where: { commentId },
  });
  if (existingLog) {
    app.log.info({ commentId }, 'Skipping automation: comment already processed');
    return { skipped: true, reason: 'DUPLICATE_COMMENT_ALREADY_PROCESSED' };
  }

  // 4. Find matching rule
  const candidateRules = account.rules.filter(
    (r) => r.targetPostId === 'ALL_POSTS' || r.targetPostId === mediaId
  );

  let matchedRule: (typeof candidateRules)[0] | null = null;
  let matchedKeyword: string | null = null;

  for (const rule of candidateRules) {
    const matchResult = evaluateCommentMatch(commentText, rule.matchType, rule.keywords);
    if (matchResult.isMatch) {
      matchedRule = rule;
      matchedKeyword = matchResult.matchedKeyword;
      break;
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // If no rule matched, increment totalComments and return
  if (!matchedRule) {
    await app.prisma.instagramDailyStat.upsert({
      where: {
        instagramAccountId_date: {
          instagramAccountId: account.id,
          date: todayStr,
        },
      },
      create: {
        instagramAccountId: account.id,
        date: todayStr,
        totalComments: 1,
      },
      update: {
        totalComments: { increment: 1 },
      },
    });
    return { skipped: true, reason: 'NO_MATCHING_RULE' };
  }

  // 5. Decrypt Page Access Token
  let pageToken: string;
  try {
    pageToken = decryptToken(account.accessToken);
  } catch (err: any) {
    app.log.error({ err, accountId: account.id }, 'Failed to decrypt Instagram page access token');
    return { skipped: true, reason: 'TOKEN_DECRYPTION_FAILED' };
  }

  let publicReplyStatus = 'SKIPPED';
  let publicReplyText: string | null = null;
  let dmStatus = 'SKIPPED';
  let dmError: string | null = null;

  // 6. Action 1: Public Comment Reply
  if (matchedRule.publicReplies && matchedRule.publicReplies.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchedRule.publicReplies.length);
    publicReplyText = matchedRule.publicReplies[randomIndex];

    try {
      await postPublicCommentReply(pageToken, commentId, publicReplyText);
      publicReplyStatus = 'SUCCESS';
    } catch (err: any) {
      publicReplyStatus = 'FAILED';
      app.log.warn({ err: err?.message, commentId }, 'Failed to post public reply to comment');
    }
  }

  // 7. Action 2: Private DM Reply to Comment (1-time private reply)
  if (matchedRule.dmMessage?.trim()) {
    const finalDmText = interpolateDmMessage(matchedRule.dmMessage, matchedRule.linkUrl, commenterUsername);

    try {
      await sendPrivateCommentReply(
        pageToken,
        commentId,
        finalDmText,
        account.instagramBusinessAccountId
      );
      dmStatus = 'SUCCESS';
    } catch (err: any) {
      dmStatus = 'FAILED';
      dmError = err?.message || 'Meta API rejected private message';
      app.log.warn({ err: err?.message, commentId }, 'Failed to send private DM reply to comment');
    }
  }

  // 8. Record in InstagramCommentLog (Unique constraint on commentId prevents duplicates)
  try {
    await app.prisma.instagramCommentLog.create({
      data: {
        instagramAccountId: account.id,
        ruleId: matchedRule.id,
        mediaId,
        commentId,
        commenterUsername,
        commentText,
        matchedKeyword,
        publicReplyStatus,
        publicReplyText,
        dmStatus,
        dmError,
      },
    });
  } catch (err: any) {
    app.log.error({ err: err?.message, commentId }, 'Error saving InstagramCommentLog');
  }

  // 9. Upsert InstagramDailyStat
  try {
    const hasFailed = publicReplyStatus === 'FAILED' || dmStatus === 'FAILED';
    await app.prisma.instagramDailyStat.upsert({
      where: {
        instagramAccountId_date: {
          instagramAccountId: account.id,
          date: todayStr,
        },
      },
      create: {
        instagramAccountId: account.id,
        date: todayStr,
        totalComments: 1,
        matchedRules: 1,
        publicRepliesSent: publicReplyStatus === 'SUCCESS' ? 1 : 0,
        dmsSent: dmStatus === 'SUCCESS' ? 1 : 0,
        failedActions: hasFailed ? 1 : 0,
      },
      update: {
        totalComments: { increment: 1 },
        matchedRules: { increment: 1 },
        publicRepliesSent: { increment: publicReplyStatus === 'SUCCESS' ? 1 : 0 },
        dmsSent: { increment: dmStatus === 'SUCCESS' ? 1 : 0 },
        failedActions: { increment: hasFailed ? 1 : 0 },
      },
    });
  } catch (err: any) {
    app.log.error({ err: err?.message }, 'Error upserting InstagramDailyStat');
  }

  return {
    success: true,
    ruleId: matchedRule.id,
    matchedKeyword,
    publicReplyStatus,
    dmStatus,
  };
}

// -----------------------------------------------------------------------------
// Two-Way Direct Messaging & Conversation Management
// -----------------------------------------------------------------------------

/**
 * Lists conversation threads for an external partner tenant
 */
export async function listPartnerConversations(
  app: FastifyInstance,
  tenantId: string,
  options: { page?: number; limit?: number; search?: string }
) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(Number(options.limit) || 25, 100));
  const skip = (page - 1) * limit;

  const tenantFilter = [{ tenantId }, { influencerId: tenantId }];
  const where: any = {};

  if (options.search?.trim()) {
    const searchFilter = [
      { participantUsername: { contains: options.search.trim(), mode: 'insensitive' } },
      { instagramParticipantId: { contains: options.search.trim() } },
      { messages: { some: { messageText: { contains: options.search.trim(), mode: 'insensitive' } } } },
    ];
    where.AND = [{ OR: tenantFilter }, { OR: searchFilter }];
  } else {
    where.OR = tenantFilter;
  }

  const [total, conversations] = await Promise.all([
    app.prisma.instagramDirectConversation.count({ where }),
    app.prisma.instagramDirectConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            direction: true,
            messageText: true,
            mediaUrl: true,
            mediaType: true,
            sentAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);

  const now = new Date();
  const items = conversations.map((conv) => {
    const isWindowOpen = conv.windowExpiresAt ? conv.windowExpiresAt > now : false;
    return {
      id: conv.id,
      tenantId: conv.tenantId,
      instagramAccountId: conv.instagramAccountId,
      participantId: conv.instagramParticipantId,
      participantUsername: conv.participantUsername,
      lastMessageAt: conv.lastMessageAt,
      windowExpiresAt: conv.windowExpiresAt,
      isWindowOpen,
      totalMessages: conv._count.messages,
      lastMessage: conv.messages[0] || null,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Returns messages for a specific conversation thread
 */
export async function getPartnerConversationMessages(
  app: FastifyInstance,
  tenantId: string,
  conversationId: string,
  options: { page?: number; limit?: number }
) {
  const conversation = await app.prisma.instagramDirectConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || (conversation.tenantId !== tenantId && conversation.influencerId !== tenantId)) {
    throw new AppError('CONVERSATION_NOT_FOUND', 'Instagram conversation not found for this tenant.', 404);
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(Number(options.limit) || 50, 100));
  const skip = (page - 1) * limit;

  const [total, messages] = await Promise.all([
    app.prisma.instagramDirectMessage.count({ where: { conversationId } }),
    app.prisma.instagramDirectMessage.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        instagramMessageId: true,
        direction: true,
        messageText: true,
        mediaUrl: true,
        mediaType: true,
        sentAt: true,
      },
    }),
  ]);

  const isWindowOpen = conversation.windowExpiresAt ? conversation.windowExpiresAt > new Date() : false;

  return {
    conversation: {
      id: conversation.id,
      participantId: conversation.instagramParticipantId,
      participantUsername: conversation.participantUsername,
      windowExpiresAt: conversation.windowExpiresAt,
      isWindowOpen,
    },
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Sends an outbound message in an existing conversation thread
 */
export async function sendPartnerDirectMessage(
  app: FastifyInstance,
  input: {
    tenantId: string;
    conversationId: string;
    messageText?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'file';
    useHumanAgentTag?: boolean;
  }
) {
  const { tenantId, conversationId, messageText, mediaUrl, mediaType, useHumanAgentTag } = input;
  if (!messageText?.trim() && !mediaUrl?.trim()) {
    throw new AppError('MESSAGE_REQUIRED', 'Either messageText or mediaUrl is required.', 400);
  }

  const conversation = await app.prisma.instagramDirectConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || (conversation.tenantId !== tenantId && conversation.influencerId !== tenantId)) {
    throw new AppError('CONVERSATION_NOT_FOUND', 'Instagram conversation not found for this tenant.', 404);
  }

  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account || !account.isActive) {
    throw new AppError('INSTAGRAM_NOT_CONNECTED', 'No active Instagram account connected for this tenant.', 404);
  }

  const pageToken = decryptToken(account.accessToken);

  // Check 24-hour window
  const now = new Date();
  const isWithin24h = conversation.windowExpiresAt ? conversation.windowExpiresAt > now : false;
  const shouldUseTag = useHumanAgentTag ?? (!isWithin24h);

  const result = await sendMetaDirectMessage(pageToken, {
    recipientId: conversation.instagramParticipantId,
    messageText: messageText?.trim(),
    mediaUrl: mediaUrl?.trim(),
    mediaType,
    useHumanAgentTag: shouldUseTag,
    instagramBusinessAccountId: account.instagramBusinessAccountId,
  });

  const sentAt = new Date();
  const messageRecord = await app.prisma.instagramDirectMessage.create({
    data: {
      conversationId,
      instagramMessageId: result.message_id ?? null,
      direction: 'OUTBOUND',
      messageText: messageText?.trim() || '',
      mediaUrl: mediaUrl?.trim() || null,
      mediaType: mediaType || null,
      sentAt,
    },
  });

  await app.prisma.instagramDirectConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: sentAt },
  });

  return {
    success: true,
    message: {
      id: messageRecord.id,
      instagramMessageId: messageRecord.instagramMessageId,
      direction: messageRecord.direction,
      messageText: messageRecord.messageText,
      mediaUrl: messageRecord.mediaUrl,
      mediaType: messageRecord.mediaType,
      sentAt: messageRecord.sentAt,
    },
  };
}

/**
 * Initiates an outbound message directly to an Instagram recipient ID
 */
export async function sendPartnerDirectToRecipient(
  app: FastifyInstance,
  input: {
    tenantId: string;
    recipientId: string;
    messageText?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'file';
    useHumanAgentTag?: boolean;
  }
) {
  const { tenantId, recipientId, messageText, mediaUrl, mediaType, useHumanAgentTag } = input;
  if (!recipientId?.trim()) {
    throw new AppError('RECIPIENT_REQUIRED', 'recipientId is required.', 400);
  }
  if (!messageText?.trim() && !mediaUrl?.trim()) {
    throw new AppError('MESSAGE_REQUIRED', 'Either messageText or mediaUrl is required.', 400);
  }

  const account = await app.prisma.instagramAccount.findUnique({
    where: { tenantOrUserId: tenantId },
  });

  if (!account || !account.isActive) {
    throw new AppError('INSTAGRAM_NOT_CONNECTED', 'No active Instagram account connected for this tenant.', 404);
  }

  const pageToken = decryptToken(account.accessToken);

  const result = await sendMetaDirectMessage(pageToken, {
    recipientId: recipientId.trim(),
    messageText: messageText?.trim(),
    mediaUrl: mediaUrl?.trim(),
    mediaType,
    useHumanAgentTag,
    instagramBusinessAccountId: account.instagramBusinessAccountId,
  });

  const sentAt = new Date();
  let conversation = await app.prisma.instagramDirectConversation.findFirst({
    where: {
      tenantId,
      instagramParticipantId: recipientId.trim(),
    },
  });

  if (!conversation) {
    conversation = await app.prisma.instagramDirectConversation.create({
      data: {
        tenantId,
        instagramAccountId: account.instagramBusinessAccountId,
        instagramParticipantId: recipientId.trim(),
        lastMessageAt: sentAt,
      },
    });
  } else {
    await app.prisma.instagramDirectConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: sentAt },
    });
  }

  const messageRecord = await app.prisma.instagramDirectMessage.create({
    data: {
      conversationId: conversation.id,
      instagramMessageId: result.message_id ?? null,
      direction: 'OUTBOUND',
      messageText: messageText?.trim() || '',
      mediaUrl: mediaUrl?.trim() || null,
      mediaType: mediaType || null,
      sentAt,
    },
  });

  return {
    success: true,
    conversationId: conversation.id,
    message: {
      id: messageRecord.id,
      instagramMessageId: messageRecord.instagramMessageId,
      direction: messageRecord.direction,
      messageText: messageRecord.messageText,
      mediaUrl: messageRecord.mediaUrl,
      mediaType: messageRecord.mediaType,
      sentAt: messageRecord.sentAt,
    },
  };
}

/**
 * Ingests inbound direct messages received for partner InstagramAccounts
 */
export async function processPartnerDirectMessageWebhook(
  app: FastifyInstance,
  payload: unknown
): Promise<number> {
  if (!payload || typeof payload !== 'object') return 0;
  const entries = Array.isArray((payload as any).entry) ? (payload as any).entry : [];
  let saved = 0;

  for (const entry of entries) {
    const accountId = typeof entry?.id === 'string' ? entry.id : undefined;
    if (!accountId) continue;

    const account = await app.prisma.instagramAccount.findFirst({
      where: {
        OR: [
          { instagramBusinessAccountId: accountId },
          { tenantOrUserId: accountId },
        ],
        isActive: true,
      },
    });

    let tenantOrUserId = account?.tenantOrUserId;
    let businessAccountId = account?.instagramBusinessAccountId || accountId;

    if (!account) {
      const connection = await app.prisma.instagramConnection.findFirst({
        where: {
          OR: [
            { instagramUserId: accountId },
            { webhookInstagramAccountId: accountId },
            { influencerId: accountId },
          ],
        },
      });
      if (connection) {
        tenantOrUserId = connection.influencerId;
        businessAccountId = connection.instagramUserId;
      }
    }

    app.log.info(
      { accountId, foundPartnerAccount: account?.username || null, mappedTenantOrUser: tenantOrUserId },
      `📬 [PARTNER DIRECT INBOX] Looking up partner account for entry id: ${accountId} (tenant: ${tenantOrUserId || 'none'})`
    );

    if (!tenantOrUserId) continue;

    const events = [
      ...(Array.isArray(entry?.messaging) ? entry.messaging : []),
      ...(Array.isArray(entry?.changes)
        ? entry.changes.filter((c: any) => c?.field === 'messages').map((c: any) => c.value)
        : []),
    ];

    for (const event of events) {
      const message = event?.message ?? event;
      const text = typeof message?.text === 'string' ? message.text.trim() : '';
      const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
      const firstAttachment = attachments[0]?.payload?.url ? attachments[0] : null;
      const mediaUrl = firstAttachment?.payload?.url || null;
      const mediaType = firstAttachment?.type || null;

      const messageId =
        typeof message?.mid === 'string'
          ? message.mid
          : typeof message?.id === 'string'
          ? message.id
          : undefined;
      const senderId =
        typeof event?.sender?.id === 'string'
          ? event.sender.id
          : typeof event?.from?.id === 'string'
          ? event.from.id
          : undefined;

      app.log.info(
        { senderId, messageId, text, account: account?.username || tenantOrUserId },
        `📬 [PARTNER DIRECT INBOX] Received message from ${senderId}: "${text}"`
      );

      // Skip if sender is the business account itself or no content
      if (!senderId || senderId === businessAccountId || (!text && !mediaUrl)) {
        continue;
      }

      const senderUsername = event?.sender?.username ?? event?.from?.username ?? null;
      const timestamp = Number(event?.timestamp ?? message?.timestamp);
      const sentAt = Number.isFinite(timestamp)
        ? new Date(timestamp > 10_000_000_000 ? timestamp : timestamp * 1000)
        : new Date();
      const windowExpiresAt = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);

      let conversation = await app.prisma.instagramDirectConversation.findFirst({
        where: {
          instagramParticipantId: senderId,
          OR: [
            { tenantId: tenantOrUserId },
            { influencerId: tenantOrUserId },
            { instagramAccountId: businessAccountId },
          ],
        },
      });

      const userRec = await app.prisma.user.findUnique({
        where: { id: tenantOrUserId },
        select: { id: true },
      });

      if (!conversation) {
        conversation = await app.prisma.instagramDirectConversation.create({
          data: {
            tenantId: tenantOrUserId,
            influencerId: userRec ? userRec.id : null,
            instagramAccountId: businessAccountId,
            instagramParticipantId: senderId,
            participantUsername: senderUsername,
            lastMessageAt: sentAt,
            windowExpiresAt,
          },
        });
      } else {
        await app.prisma.instagramDirectConversation.update({
          where: { id: conversation.id },
          data: {
            tenantId: conversation.tenantId || tenantOrUserId,
            influencerId: conversation.influencerId || (userRec ? userRec.id : null),
            participantUsername: senderUsername ?? conversation.participantUsername,
            lastMessageAt: sentAt,
            windowExpiresAt,
          },
        });
      }

      try {
        await app.prisma.instagramDirectMessage.create({
          data: {
            conversationId: conversation.id,
            instagramMessageId: messageId,
            direction: 'INBOUND',
            messageText: text,
            mediaUrl,
            mediaType,
            sentAt,
          },
        });
        saved += 1;
      } catch (error: any) {
        if (!(typeof error === 'object' && error && 'code' in error && error.code === 'P2002')) {
          app.log.error({ err: error, messageId }, 'Error saving inbound direct message');
        }
      }
    }
  }

  return saved;
}

