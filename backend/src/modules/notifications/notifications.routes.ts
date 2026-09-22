import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/notifications', async (request) => {
    const actor = requireAuth(request);
    const query = request.query as {
      filter?: 'all' | 'unread' | string;
    };

    const where: any = {
      userId: actor.userId,
    };

    if (query.filter === 'unread') {
      where.readAt = null;
    } else if (query.filter && query.filter !== 'all') {
      where.kind = query.filter.toUpperCase();
    }

    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: actor.userId,
        readAt: null,
      },
    });

    return {
      unreadCount,
      notifications: rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        kind: row.kind,
        link: row.link,
        read: Boolean(row.readAt),
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
    };
  });

  app.patch('/notifications/:id/read', async (request) => {
    const actor = requireAuth(request);
    const { id } = request.params as { id: string };

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: actor.userId,
      },
    });

    if (!notification) {
      throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found.', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return {
      success: true,
      notification: {
        id: updated.id,
        read: true,
        readAt: updated.readAt,
      },
    };
  });

  app.post('/notifications/read-all', async (request) => {
    const actor = requireAuth(request);

    await prisma.notification.updateMany({
      where: {
        userId: actor.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      success: true,
    };
  });
};
