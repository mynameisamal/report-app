// ============================================================
// TaskMaster PEI - Report Service
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma, checkDatabaseConnection, Role } from '@taskmaster/database';
import { ApiResponse, ERRORS } from '@taskmaster/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4004', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => {
    const dbOk = await checkDatabaseConnection();
    return { status: dbOk ? 'ok' : 'error', service: 'report-service', db: dbOk };
  });

  // GET /api/reports - Get all reports
  app.get('/api/reports', async (request: any, reply) => {
    try {
      const { userId, date } = request.query;
      const where: any = {};
      if (userId) where.userId = userId;
      if (date) where.date = new Date(date);

      const reports = await prisma.dailyReport.findMany({
        where,
        include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
        orderBy: { date: 'desc' },
      });
      return reply.send({ success: true, data: reports } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/reports/my/:userId - Get reports for a user
  app.get('/api/reports/my/:userId', async (request: any, reply) => {
    try {
      const reports = await prisma.dailyReport.findMany({
        where: { userId: request.params.userId },
        include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
        orderBy: { date: 'desc' },
      });
      return reply.send({ success: true, data: reports } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // POST /api/reports/generate - Generate daily report
  app.post('/api/reports/generate', async (request: any, reply) => {
    try {
      const { userId, force = false } = request.body;
      if (!userId) return reply.status(400).send({ success: false, error: 'userId is required' } as ApiResponse);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Check if report already exists for today
      if (!force) {
        const existing = await prisma.dailyReport.findFirst({
          where: { userId, date: today },
        });
        if (existing) {
          return reply.send({ success: true, data: existing, message: 'Report already exists for today' } as ApiResponse);
        }
      }

      // Get user info
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ success: false, error: ERRORS.USER_NOT_FOUND } as ApiResponse);

      // Get tasks for this user
      const tasks = await prisma.task.findMany({
        where: { assignedTo: userId },
      });

      const totalAll = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCEPTED');
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
      const pendingTasks = tasks.filter(t => t.status === 'PENDING');
      const overdueTasks = tasks.filter(t => {
        if (t.status !== 'COMPLETED' && t.status !== 'ACCEPTED' && t.targetDate) {
          return new Date() > new Date(t.targetDate);
        }
        return false;
      });

      // Generate report content
      const niceDate = today.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      let content = `📋 *DAILY REPORT - TASKMASTER PEI* 📋\n`;
      content += `👤 *User:* ${user.fullName.toUpperCase()} (${user.role})\n`;
      content += `📅 *Date:* ${niceDate}\n\n`;
      content += `📊 *SUMMARY*\n`;
      content += `▪️ Total Tasks: ${totalAll}\n`;
      content += `▪️ Completed: ${completedTasks.length}\n`;
      content += `▪️ In Progress: ${inProgressTasks.length}\n`;
      content += `▪️ Pending: ${pendingTasks.length}\n`;
      content += `▪️ Overdue: ${overdueTasks.length}\n\n`;

      if (tasks.length > 0) {
        content += `📌 *TASK DETAILS:*\n`;
        tasks.forEach((t, i) => {
          let statusLabel = '⚪ PENDING';
          if (t.status === 'IN_PROGRESS') statusLabel = '🟡 IN PROGRESS';
          if (t.status === 'REVIEW') statusLabel = '🟠 IN REVIEW';
          if (t.status === 'ACCEPTED') statusLabel = '🟢 ACCEPTED';
          if (t.status === 'COMPLETED') statusLabel = '✅ COMPLETED';
          if (t.status === 'REJECTED') statusLabel = '🔴 REJECTED';

          const isLate = t.status !== 'COMPLETED' && t.status !== 'ACCEPTED' && t.targetDate && new Date() > new Date(t.targetDate);
          content += `*${i + 1}. ${t.title}*\n`;
          content += `   • Status: ${statusLabel}\n`;
          if (t.targetDate) content += `   • Deadline: ${t.targetDate.toISOString().split('T')[0]}${isLate ? ' ⚠️ Overdue' : ''}\n`;
          content += '\n';
        });
      }

      content += `✨ _Auto-generated daily report_`;

      // Save or update report
      const report = await prisma.dailyReport.upsert({
        where: { userId_date: { userId, date: today } },
        update: { content, tasksCompleted: completedTasks.length, tasksInProgress: inProgressTasks.length, tasksPending: pendingTasks.length, isAuto: !force },
        create: { userId, date: today, content, tasksCompleted: completedTasks.length, tasksInProgress: inProgressTasks.length, tasksPending: pendingTasks.length, isAuto: !force },
      });

      return reply.send({ success: true, data: report, message: 'Report generated' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // DELETE /api/reports/:id
  app.delete('/api/reports/:id', async (request: any, reply) => {
    try {
      await prisma.dailyReport.delete({ where: { id: request.params.id } });
      return reply.send({ success: true, message: 'Report deleted' } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/dashboard/stats/:userId - Dashboard statistics
  app.get('/api/dashboard/stats/:userId', async (request: any, reply) => {
    try {
      const userId = request.params.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ success: false, error: ERRORS.USER_NOT_FOUND } as ApiResponse);

      const tasks = await prisma.task.findMany({
        where: { assignedTo: userId },
      });

      const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCEPTED').length;
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEW').length;
      const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
      const overdueTasks = tasks.filter(t => {
        if (t.status !== 'COMPLETED' && t.status !== 'ACCEPTED' && t.targetDate) {
          return new Date() > new Date(t.targetDate);
        }
        return false;
      }).length;

      // Get team info if lead role
      let teamMembers = 0;
      if (['KOORDINATOR', 'LEAD_IT', 'LEAD_AI'].includes(user.role)) {
        const roleMap: Record<string, Role> = {
          KOORDINATOR: Role.TEKNISI,
          LEAD_IT: Role.IT_PROGRAMMER,
          LEAD_AI: Role.AI_ENGINEER,
        };
        teamMembers = await prisma.user.count({
          where: { role: roleMap[user.role] as Role, isActive: true },
        });
      }

      const stats = {
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        teamMembers,
        activeProjects: await prisma.project.count(),
      };

      return reply.send({ success: true, data: stats } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  // GET /api/dashboard/team-summary/:userId - Team summary (for leads/direktur)
  app.get('/api/dashboard/team-summary/:userId', async (request: any, reply) => {
    try {
      const userId = request.params.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ success: false, error: ERRORS.USER_NOT_FOUND } as ApiResponse);

      let targetRoles: Role[];
      if (user.role === Role.DIREKTUR) {
        targetRoles = [Role.KOORDINATOR, Role.LEAD_IT, Role.LEAD_AI, Role.TEKNISI, Role.IT_PROGRAMMER, Role.AI_ENGINEER];
      } else if (user.role === Role.KOORDINATOR) {
        targetRoles = [Role.TEKNISI];
      } else if (user.role === Role.LEAD_IT) {
        targetRoles = [Role.IT_PROGRAMMER];
      } else if (user.role === Role.LEAD_AI) {
        targetRoles = [Role.AI_ENGINEER];
      } else {
        targetRoles = [];
      }

      const teamMembers = await prisma.user.findMany({
        where: { role: { in: targetRoles }, isActive: true },
        select: { id: true, username: true, fullName: true, role: true, avatarUrl: true },
      });

      const teamSummary = await Promise.all(teamMembers.map(async (member) => {
        const tasks = await prisma.task.findMany({ where: { assignedTo: member.id } });
        return {
          userId: member.id,
          fullName: member.fullName,
          username: member.username,
          role: member.role,
          activeTasks: tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ACCEPTED').length,
          completedTasks: tasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCEPTED').length,
          overdueTasks: tasks.filter(t => {
            if (t.status !== 'COMPLETED' && t.status !== 'ACCEPTED' && t.targetDate) {
              return new Date() > new Date(t.targetDate);
            }
            return false;
          }).length,
        };
      }));

      return reply.send({ success: true, data: teamSummary } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message } as ApiResponse);
    }
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n📊 Report Service running on http://${HOST}:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
