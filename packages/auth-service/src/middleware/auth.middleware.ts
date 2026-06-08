// ============================================================
// TaskMaster PEI - Auth Middleware
// ============================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JwtPayload, ApiResponse, ERRORS } from '@taskmaster/shared';

const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required in auth middleware');
  process.exit(1);
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JwtPayload;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: ERRORS.UNAUTHORIZED,
    } as ApiResponse);
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = decoded;
  } catch (error) {
    reply.status(401).send({
      success: false,
      error: 'Invalid or expired token',
    } as ApiResponse);
    return;
  }
}

/**
 * Check if user has required role
 */
export function authorize(...allowedRoles: string[]) {
  return async (
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({
        success: false,
        error: ERRORS.UNAUTHORIZED,
      } as ApiResponse);
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        success: false,
        error: ERRORS.FORBIDDEN,
      } as ApiResponse);
      return;
    }
  };
}
