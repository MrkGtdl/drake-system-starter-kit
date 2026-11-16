import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
  organizationId: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata
        ? JSON.parse(JSON.stringify(input.metadata))
        : undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
