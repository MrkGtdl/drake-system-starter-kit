import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

const updateNotificationSchema = z.union([
  z.object({
    id: z.string().min(1),
  }),
  z.object({
    markAll: z.literal(true),
  }),
]);

const deleteNotificationSchema = z.object({
  id: z.string().min(1),
});

function notificationScope(userId: string, organizationId: string) {
  return {
    userId,
    OR: [{ organizationId }, { organizationId: null }],
  };
}

function handleError(error: unknown, action: string) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }

  console.error(`${action} failed:`, error);

  return NextResponse.json(
    { success: false, error: `Unable to ${action.toLowerCase()}` },
    { status: 500 },
  );
}

// GET /api/notifications
export async function GET() {
  try {
    const context = await requirePermission({
      notification: ["read"],
    });

    const where = notificationScope(context.user.id, context.organizationId);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          link: true,
          readAt: true,
          createdAt: true,
        },
      }),

      prisma.notification.count({
        where: {
          ...where,
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    return handleError(error, "Fetch notifications");
  }
}

// PATCH /api/notifications
export async function PATCH(request: Request) {
  try {
    const context = await requirePermission({
      notification: ["update"],
    });

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const validation = updateNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification update",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const scope = notificationScope(context.user.id, context.organizationId);

    const result = await prisma.notification.updateMany({
      where: {
        ...scope,
        ...("markAll" in validation.data
          ? { readAt: null }
          : { id: validation.data.id }),
      },
      data: {
        readAt: new Date(),
      },
    });

    const isMarkAll = "markAll" in validation.data;

    if (!isMarkAll && result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: isMarkAll
        ? "All notifications marked as read"
        : "Notification marked as read",
      updatedCount: result.count,
    });
  } catch (error) {
    return handleError(error, "Update notifications");
  }
}

// DELETE /api/notifications
export async function DELETE(request: Request) {
  try {
    const context = await requirePermission({
      notification: ["delete"],
    });

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const validation = deleteNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification data",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await prisma.notification.deleteMany({
      where: {
        ...notificationScope(context.user.id, context.organizationId),
        id: validation.data.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return handleError(error, "Delete notifications");
  }
}
