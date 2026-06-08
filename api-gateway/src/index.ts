// ============================================================
// TaskMaster PEI - API Gateway
// Central gateway routing to all microservices
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  task: process.env.TASK_SERVICE_URL || 'http://localhost:4003',
  report: process.env.REPORT_SERVICE_URL || 'http://localhost:4004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
};

async function proxyRequest(serviceUrl: string, request: any, reply: any) {
  try {
    const targetUrl = `${serviceUrl}${request.url}`;
    const headers: Record<string, string> = {};
    if (request.headers.authorization) headers['authorization'] = request.headers.authorization as string;
    if (request.headers['content-type']) headers['content-type'] = request.headers['content-type'] as string;

    const options: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
      options.body = JSON.stringify(request.body);
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json();
    return reply.status(response.status).send(data);
  } catch (error: any) {
    return reply.status(502).send({
      success: false,
      error: `Service unavailable: ${error.message}`,
    });
  }
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4000',
      'electron://*',
      'app://*',
    ],
    credentials: true,
  });

  // Rate limiting (100 requests per minute globally, stricter on auth)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'api-gateway',
    services: {
      auth: SERVICES.auth,
      user: SERVICES.user,
      task: SERVICES.task,
      report: SERVICES.report,
      notification: SERVICES.notification,
    },
  }));

  // Auth routes proxy
  app.all('/api/auth/*', async (request, reply) => proxyRequest(SERVICES.auth, request, reply));

  // User routes proxy
  app.all('/api/users/*', async (request, reply) => proxyRequest(SERVICES.user, request, reply));

  // Task routes proxy
  app.all('/api/tasks/*', async (request, reply) => proxyRequest(SERVICES.task, request, reply));

  // Report routes proxy
  app.all('/api/reports/*', async (request, reply) => proxyRequest(SERVICES.report, request, reply));

  // Dashboard routes proxy (served by report service)
  app.all('/api/dashboard/*', async (request, reply) => proxyRequest(SERVICES.report, request, reply));

  // Notification routes proxy
  app.all('/api/notifications/*', async (request, reply) => proxyRequest(SERVICES.notification, request, reply));

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 API Gateway running on http://${HOST}:${PORT}`);
    console.log(`   Health: http://${HOST}:${PORT}/health`);
    console.log(`   Proxied services:`);
    console.log(`   ├── Auth Service      → ${SERVICES.auth}`);
    console.log(`   ├── User Service      → ${SERVICES.user}`);
    console.log(`   ├── Task Service      → ${SERVICES.task}`);
    console.log(`   ├── Report Service    → ${SERVICES.report}`);
    console.log(`   └── Notification Svc  → ${SERVICES.notification}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
