// ============================================================
// TaskMaster PEI - Task Service
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma, checkDatabaseConnection } from '@taskmaster/database';
import { ApiResponse, ERRORS, TaskStatus } from '@taskmaster/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4003', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => {
    const dbOk = await checkDatabaseConnection();
    return { status: dbOk ? 'ok' : 'error', service: 'task-service', db: dbOk };
  });

  // GET /api/tasks - List all tasks with filters
  app.get('/api/tasks', async (request: any, reply) => {
    try {
      const { status, assignedTo, createdBy, projectId } = request.query;
      const where: any = {};
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;
      if (createdBy) where.createdBy = createdBy;
      if (projectId) where.projectId = projectId;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, username: true, fullName: true, role: true, avatarUrl: true } },
          creator: { select: { id: true, username: true, fullName: true, role: true, avatarUrl: true } },
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, data: tasks } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/tasks/my/:userId - Get tasks assigned to a user
  app.get('/api/tasks/my/:userId', async (request: any, reply) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { assignedTo: request.params.userId },
        include: {
          creator: { select: { id: true, username: true, fullName: true, role: true } },
          project: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, data: tasks } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/tasks/:id - Get task by ID
  app.get('/api/tasks/:id', async (request: any, reply) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
        include: {
          assignee: { select: { id: true, username: true, fullName: true, role: true, avatarUrl: true } },
          creator: { select: { id: true, username: true, fullName: true, role: true, avatarUrl: true } },
          project: true,
        },
      });
      if (!task) return reply.status(404).send({ success: false, error: ERRORS.TASK_NOT_FOUND } as ApiResponse);
      return reply.send({ success: true, data: task } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // POST /api/tasks - Create a new task
  app.post('/api/tasks', async (request: any, reply) => {
    try {
      const { title, description, instructions, githubLink, assignedTo, projectId, targetDate, createdBy } = request.body;
      if (!title || !createdBy) {
        return reply.status(400).send({ success: false, error: 'Title and createdBy are required' } as ApiResponse);
      }
      const task = await prisma.task.create({
        data: { title, description, instructions, githubLink, assignedTo, projectId, createdBy, targetDate: targetDate ? new Date(targetDate) : null },
        include: {
          assignee: { select: { id: true, username: true, fullName: true, role: true } },
          creator: { select: { id: true, username: true, fullName: true, role: true } },
        },
      });
      return reply.status(201).send({ success: true, data: task, message: 'Task created' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // PUT /api/tasks/:id - Update task
  app.put('/api/tasks/:id', async (request: any, reply) => {
    try {
      const { title, description, instructions, githubLink, status, assignedTo, projectId, targetDate } = request.body;
      const updateData: any = { title, description, instructions, githubLink, status: status as TaskStatus, assignedTo, projectId };
      if (targetDate) updateData.targetDate = new Date(targetDate);
      if (status === 'COMPLETED' || status === 'ACCEPTED') updateData.completedAt = new Date();

      const task = await prisma.task.update({
        where: { id: request.params.id },
        data: updateData,
        include: {
          assignee: { select: { id: true, username: true, fullName: true, role: true } },
          creator: { select: { id: true, username: true, fullName: true, role: true } },
        },
      });
      return reply.send({ success: true, data: task, message: 'Task updated' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // PUT /api/tasks/:id/status - Update task status
  app.put('/api/tasks/:id/status', async (request: any, reply) => {
    try {
      const { status } = request.body;
      const updateData: any = { status: status as TaskStatus };
      if (status === 'COMPLETED' || status === 'ACCEPTED') updateData.completedAt = new Date();

      const task = await prisma.task.update({
        where: { id: request.params.id },
        data: updateData,
      });
      return reply.send({ success: true, data: task, message: `Status updated to ${status}` } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // DELETE /api/tasks/:id - Delete task
  app.delete('/api/tasks/:id', async (request: any, reply) => {
    try {
      await prisma.task.delete({ where: { id: request.params.id } });
      return reply.send({ success: true, message: 'Task deleted' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n📋 Task Service running on http://${HOST}:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
