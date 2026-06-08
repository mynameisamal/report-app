// ============================================================
// TaskMaster PEI - User Service
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma, checkDatabaseConnection } from '@taskmaster/database';
import { ApiResponse, ERRORS, Role } from '@taskmaster/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4002', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => {
    const dbOk = await checkDatabaseConnection();
    return { status: dbOk ? 'ok' : 'error', service: 'user-service', db: dbOk };
  });

  // GET /api/users - List all users
  app.get('/api/users', async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, fullName: true, email: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
        orderBy: { fullName: 'asc' },
      });
      return reply.send({ success: true, data: users } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/users/:id - Get user by ID
  app.get('/api/users/:id', async (request: any, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.params.id },
        select: { id: true, username: true, fullName: true, email: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
      });
      if (!user) return reply.status(404).send({ success: false, error: ERRORS.USER_NOT_FOUND } as ApiResponse);
      return reply.send({ success: true, data: user } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/users/role/:role - Get users by role
  app.get('/api/users/role/:role', async (request: any, reply) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: request.params.role as Role, isActive: true },
        select: { id: true, username: true, fullName: true, role: true, avatarUrl: true },
        orderBy: { fullName: 'asc' },
      });
      return reply.send({ success: true, data: users } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // PUT /api/users/:id - Update user
  app.put('/api/users/:id', async (request: any, reply) => {
    try {
      const { fullName, email, avatarUrl, isActive, role } = request.body;
      const user = await prisma.user.update({
        where: { id: request.params.id },
        data: { fullName, email, avatarUrl, isActive, role: role as Role },
        select: { id: true, username: true, fullName: true, email: true, role: true, avatarUrl: true, isActive: true },
      });
      return reply.send({ success: true, data: user, message: 'User updated' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // DELETE /api/users/:id - Deactivate user
  app.delete('/api/users/:id', async (request: any, reply) => {
    try {
      await prisma.user.update({
        where: { id: request.params.id },
        data: { isActive: false },
      });
      return reply.send({ success: true, message: 'User deactivated' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n👥 User Service running on http://${HOST}:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
