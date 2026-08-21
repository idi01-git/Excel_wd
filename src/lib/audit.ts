import { Prisma } from '@prisma/client';
import { db } from './db';

type RequestLike = Pick<Request, 'headers'>;

export interface AuditRecordInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  target?: string;
  meta?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
  request?: RequestLike;
}

export function getRequestAuditContext(request?: RequestLike) {
  if (!request) {
    return { ipAddress: null, userAgent: null };
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  return {
    ipAddress: ipAddress || null,
    userAgent
  };
}

export async function recordAuditEvent(input: AuditRecordInput) {
  try {
    const { ipAddress, userAgent } = getRequestAuditContext(input.request);

    return await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        target: input.target ?? input.entityId,
        meta: input.meta ?? input.metadata ?? undefined,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ?? undefined,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
    return null;
  }
}
