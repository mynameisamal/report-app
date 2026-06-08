// ============================================================
// TaskMaster PEI - Notification Service
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma, checkDatabaseConnection } from '@taskmaster/database';
import { ApiResponse, ERRORS, NotificationType } from '@taskmaster/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4005', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => {
    const dbOk = await checkDatabaseConnection();
    return { status: dbOk ? 'ok' : 'error', service: 'notification-service', db: dbOk };
  });

  // GET /api/notifications/:userId - Get notifications for user
  app.get('/api/notifications/:userId', async (request: any, reply) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: request.params.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return reply.send({ success: true, data: notifications } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // POST /api/notifications - Create notification
  app.post('/api/notifications', async (request: any, reply) => {
    try {
      const { userId, type, title, message } = request.body;
      if (!userId || !type || !title) {
        return reply.status(400).send({ success: false, error: 'userId, type, and title are required' } as ApiResponse);
      }
      const notification = await prisma.notification.create({
        data: { userId, type: type as NotificationType, title, message },
      });
      return reply.status(201).send({ success: true, data: notification } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // PUT /api/notifications/:id/read - Mark notification as read
  app.put('/api/notifications/:id/read', async (request: any, reply) => {
    try {
      const notification = await prisma.notification.update({
        where: { id: request.params.id },
        data: { isRead: true },
      });
      return reply.send({ success: true, data: notification } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // PUT /api/notifications/read-all/:userId - Mark all as read
  app.put('/api/notifications/read-all/:userId', async (request: any, reply) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: request.params.userId, isRead: false },
        data: { isRead: true },
      });
      return reply.send({ success: true, message: 'All notifications marked as read' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/notifications/unread-count/:userId
  app.get('/api/notifications/unread-count/:userId', async (request: any, reply) => {
    try {
      const count = await prisma.notification.count({
        where: { userId: request.params.userId, isRead: false },
      });
      return reply.send({ success: true, data: { count } } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n🔔 Notification Service running on http://${HOST}:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
