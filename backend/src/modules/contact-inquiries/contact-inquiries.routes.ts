import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import {
  contactInquiryParamsSchema,
  createContactInquirySchema,
  listContactInquiriesQuerySchema,
  updateContactInquirySchema,
} from './contact-inquiries.schema.js';

export const contactInquiriesRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // POST /contact - Public endpoint for landing/contact page submissions
  app.post('/contact', async (req, reply) => {
    const input = createContactInquirySchema.parse(req.body);

    const inquiry = await prisma.contactInquiry.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        subject: input.subject,
        message: input.message,
        status: 'NEW',
      },
    });

    return reply.status(201).send({
      success: true,
      message: 'Inquiry received successfully',
      data: {
        id: inquiry.id,
        createdAt: inquiry.createdAt,
      },
    });
  });

  // GET /admin/inquiries - Admin list with search, status filter, and pagination
  app.get('/admin/inquiries', async (req) => {
    requireRole(req, ['ADMIN']);

    const query = listContactInquiriesQuerySchema.parse(req.query);
    const { page, limit, search, status } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total, counts] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const statusCounts = {
      NEW: 0,
      IN_REVIEW: 0,
      RESOLVED: 0,
      ARCHIVED: 0,
      ALL: 0,
    };

    let grandTotal = 0;
    for (const group of counts) {
      const count = group._count.id;
      statusCounts[group.status as keyof typeof statusCounts] = count;
      grandTotal += count;
    }
    statusCounts.ALL = grandTotal;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: statusCounts,
    };
  });

  // GET /admin/inquiries/:id - Admin single inquiry details
  app.get('/admin/inquiries/:id', async (req, reply) => {
    requireRole(req, ['ADMIN']);

    const { id } = contactInquiryParamsSchema.parse(req.params);

    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return reply.status(404).send({ message: 'Contact inquiry not found' });
    }

    return { inquiry };
  });

  // PATCH /admin/inquiries/:id - Admin update status or notes
  app.patch('/admin/inquiries/:id', async (req, reply) => {
    requireRole(req, ['ADMIN']);

    const { id } = contactInquiryParamsSchema.parse(req.params);
    const input = updateContactInquirySchema.parse(req.body);

    const existing = await prisma.contactInquiry.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Contact inquiry not found' });
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      },
    });

    return { success: true, inquiry: updated };
  });

  // DELETE /admin/inquiries/:id - Admin delete inquiry
  app.delete('/admin/inquiries/:id', async (req, reply) => {
    requireRole(req, ['ADMIN']);

    const { id } = contactInquiryParamsSchema.parse(req.params);

    await prisma.contactInquiry.delete({ where: { id } });

    return reply.status(200).send({ success: true, message: 'Inquiry deleted' });
  });
};
