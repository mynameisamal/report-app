// ============================================================
// TaskMaster PEI - Auth Service
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { checkDatabaseConnection } from '@taskmaster/database';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'production' ? false : true,
  });

  // CORS
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4000', 'electron://*'],
    credentials: true,
  });

  // Health check
  app.get('/health', async () => {
    const dbOk = await checkDatabaseConnection();
    return { status: dbOk ? 'ok' : 'error', service: 'auth-service', db: dbOk };
  });

  // Auth routes
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n🔐 Auth Service running on http://${HOST}:${PORT}`);
    console.log(`   Health: http://${HOST}:${PORT}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
