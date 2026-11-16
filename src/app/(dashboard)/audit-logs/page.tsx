import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

import AuditLogsClient from "@/components/dashboard/AuditLogsClient";

export default async function AuditLogsPage() {
  let context;

  try {
    context = await requirePermission({
      auditLog: ["read"],
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view audit logs.
          </p>
        </section>
      );
    }

    throw error;
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: context.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const initialLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AuditLogsClient initialLogs={initialLogs} />;
}
