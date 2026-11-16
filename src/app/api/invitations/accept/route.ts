import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications";

const acceptInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // 1. Verify authenticated session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Validate request body
    const body: unknown = await request.json();
    const validation = acceptInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation ID" },
        { status: 400 },
      );
    }

    // 3. Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: validation.data.invitationId,
      },
      select: {
        id: true,
        email: true,
        organizationId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 },
      );
    }

    // 4. Verify invitation status and expiration
    if (invitation.status !== "pending" || invitation.expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Invitation is no longer valid" },
        { status: 409 },
      );
    }

    // 5. Verify recipient identity
    if (
      !session.user.emailVerified ||
      session.user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Verified account must match the invitation email",
        },
        { status: 403 },
      );
    }

    // 6. Let Better Auth accept the invitation
    await auth.api.acceptInvitation({
      headers: request.headers,
      body: {
        invitationId: invitation.id,
      },
    });

    // 7. Record successful acceptance
    try {
      await createAuditLog({
        organizationId: invitation.organizationId,
        actorId: session.user.id,
        action: "INVITATION_ACCEPTED",
        entity: "Invitation",
        entityId: invitation.id,
        description: `Invitation accepted by ${session.user.email}`,
      });
    } catch (auditError) {
      console.error(
        "Invitation accepted but audit logging failed:",
        auditError,
      );
    }

    // 8. Create welcome notification
    try {
      await createNotification({
        organizationId: invitation.organizationId,
        userId: session.user.id,
        title: "Welcome to the organization",
        message: "You have successfully joined the organization.",
        type: "success",
        link: "/dashboard",
        metadata: {
          invitationId: invitation.id,
        },
      });
    } catch (notificationError) {
      console.error(
        "Invitation accepted but notification creation failed:",
        notificationError,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("Accept invitation failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to accept invitation" },
      { status: 400 },
    );
  }
}
