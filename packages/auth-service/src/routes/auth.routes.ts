// ============================================================
// TaskMaster PEI - Auth Routes
// ============================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@taskmaster/database';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, JwtPayload, ERRORS, Role } from '@taskmaster/shared';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(user: { id: string; username: string; role: string }): {
  accessToken: string;
  refreshToken: string;
} {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as Role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );

  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/auth/login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username, password } = request.body as LoginRequest;

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username and password are required',
        } as ApiResponse);
      }

      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: ERRORS.INVALID_CREDENTIALS,
        } as ApiResponse);
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.status(403).send({
          success: false,
          error: 'Account is deactivated. Contact your administrator.',
        } as ApiResponse);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: ERRORS.INVALID_CREDENTIALS,
        } as ApiResponse);
      }

      // Generate tokens
      const tokens = generateTokens(user);

      const response: LoginResponse = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role as Role,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
        },
      };

      return reply.send({
        success: true,
        data: response,
      } as ApiResponse<LoginResponse>);
    } catch (error: any) {
      app.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || ERRORS.INTERNAL_ERROR,
      } as ApiResponse);
    }
  });

  // POST /api/auth/register
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username, password, fullName, role, email } = request.body as RegisterRequest;

      // Validation
      if (!username || !password || !fullName || !role) {
        return reply.status(400).send({
          success: false,
          error: 'Username, password, full name, and role are required',
        } as ApiResponse);
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: ERRORS.USERNAME_TAKEN,
        } as ApiResponse);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: username.toLowerCase().trim(),
          passwordHash,
          fullName,
          role: role as Role,
          email: email || null,
        },
      });

      // Generate tokens
      const tokens = generateTokens(user);

      const response: LoginResponse = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role as Role,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
        },
      };

      return reply.status(201).send({
        success: true,
        data: response,
        message: 'User registered successfully',
      } as ApiResponse<LoginResponse>);
    } catch (error: any) {
      app.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || ERRORS.INTERNAL_ERROR,
      } as ApiResponse);
    }
  });

  // POST /api/auth/refresh
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
        } as ApiResponse);
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET) as unknown as JwtPayload & { type: string };

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({
          success: false,
          error: 'Invalid refresh token',
        } as ApiResponse);
      }

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          error: 'User not found or inactive',
        } as ApiResponse);
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      return reply.send({
        success: true,
        data: tokens,
      } as ApiResponse<{ accessToken: string; refreshToken: string }>);
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired refresh token',
      } as ApiResponse);
    }
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: ERRORS.USER_NOT_FOUND,
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: user,
      } as ApiResponse);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || ERRORS.INTERNAL_ERROR,
      } as ApiResponse);
    }
  });

  // POST /api/auth/logout
  app.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    // In a stateless JWT system, logout is handled client-side
    // For enhanced security, we could implement a token blacklist with Redis
    return reply.send({
      success: true,
      message: 'Logged out successfully',
    } as ApiResponse);
  });
}
