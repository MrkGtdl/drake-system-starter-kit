import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import { AuthorizationError, requirePermission } from "@/lib/authorization";
import { createNotification } from "@/lib/notifications";

const createInvitationSchema = z.object({
  email: z.string().trim().email(),
});

const cancelInvitationSchema = z.object({
  email: z.string().trim().email(),
});

// CREATE INVITATION
export async function POST(request: Request) {
  try {
    const context = await requirePermission({
      invitation: ["create"],
    });

    const body: unknown = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 },
      );
    }

    const invitation = await auth.api.createInvitation({
      headers: await headers(),
      body: {
        email: validation.data.email,
        role: "member",
        organizationId: context.organizationId,
      },
    });

    await createAuditLog({
      organizationId: context.organizationId,
      actorId: context.user.id,
      action: "INVITATION_CREATED",
      entity: "Invitation",
      entityId: invitation.id,
      description: `Invitation created for ${validation.data.email}`,
    });

    // Notify the invited user if they already have an account.
    const invitedUser = await prisma.user.findUnique({
      where: {
        email: validation.data.email,
      },
      select: {
        id: true,
      },
    });

    if (invitedUser) {
      try {
        await createNotification({
          organizationId: context.organizationId,
          userId: invitedUser.id,
          title: "Organization Invitation",
          message: "You have been invited to join an organization.",
          type: "info",
          link: `/accept-invitation/${invitation.id}`,
          metadata: {
            invitationId: invitation.id,
          },
        });
      } catch (notificationError) {
        console.error("Invitation notification failed:", notificationError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Invitation created successfully",
        data: {
          email: validation.data.email,
          role: "member",
          status: "pending",
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("Create invitation failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create invitation" },
      { status: 400 },
    );
  }
}

// GET ORGANIZATION INVITATIONS
export async function GET() {
  try {
    const context = await requirePermission({
      invitation: ["read"],
    });

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: context.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("Fetch invitations failed:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// CANCEL INVITATION
export async function DELETE(request: Request) {
  try {
    const context = await requirePermission({
      invitation: ["cancel"],
    });

    const body: unknown = await request.json();
    const validation = cancelInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 },
      );
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        email: validation.data.email,
        organizationId: context.organizationId,
        status: "pending",
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Pending invitation not found" },
        { status: 404 },
      );
    }

    await auth.api.cancelInvitation({
      headers: await headers(),
      body: {
        invitationId: invitation.id,
      },
    });

    await createAuditLog({
      organizationId: context.organizationId,
      actorId: context.user.id,
      action: "INVITATION_CANCELLED",
      entity: "Invitation",
      entityId: invitation.id,
      description: `Invitation cancelled for ${invitation.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("Cancel invitation failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to cancel invitation" },
      { status: 400 },
    );
  }
}
