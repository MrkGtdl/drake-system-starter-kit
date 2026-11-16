import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

export async function GET() {
  try {
    const context = await requirePermission({
      auditLog: ["read"],
    });

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
      },
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("Fetch audit logs failed:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
