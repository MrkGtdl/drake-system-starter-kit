import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["member", "supervisor"]),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1),
});

function getMemberRoles(role: string) {
  return role
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isProtectedRole(role: string) {
  const roles = getMemberRoles(role);
  return roles.includes("owner") || roles.includes("admin");
}

function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }

  return null;
}

// GET: List organization members
export async function GET() {
  try {
    const context = await requirePermission({
      user: ["read"],
    });

    const members = await prisma.member.findMany({
      where: {
        organizationId: context.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    console.error("Fetch organization members failed:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH: Update member role
export async function PATCH(request: Request) {
  try {
    const context = await requirePermission({
      user: ["update"],
    });

    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid member update data.",
        },
        { status: 400 },
      );
    }

    const { memberId, role } = validation.data;

    const targetMember = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Member not found." },
        { status: 404 },
      );
    }

    if (targetMember.userId === context.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot change your own organization role.",
        },
        { status: 403 },
      );
    }

    if (isProtectedRole(targetMember.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Owner and Admin roles cannot be changed here.",
        },
        { status: 403 },
      );
    }

    const requestHeaders = await headers();

    const permission = await auth.api.hasPermission({
      headers: requestHeaders,
      body: {
        permissions: {
          member: ["update"],
        },
      },
    });

    if (!permission.success) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 },
      );
    }

    await auth.api.updateMemberRole({
      headers: requestHeaders,
      body: {
        memberId: targetMember.id,
        role,
        organizationId: context.organizationId,
      },
    });

    await createAuditLog({
      organizationId: context.organizationId,
      actorId: context.user.id,
      action: "MEMBER_ROLE_UPDATED",
      entity: "Member",
      entityId: targetMember.id,
      description: `Changed ${targetMember.user.email}'s role from ${targetMember.role} to ${role}.`,
      metadata: {
        previousRole: targetMember.role,
        newRole: role,
        targetUserId: targetMember.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully.",
    });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    console.error("Update member role failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update member role." },
      { status: 500 },
    );
  }
}

// DELETE: Remove member from organization
export async function DELETE(request: Request) {
  try {
    const context = await requirePermission({
      user: ["delete"],
    });

    const body = await request.json();
    const validation = removeMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid member removal data.",
        },
        { status: 400 },
      );
    }

    const { memberId } = validation.data;

    const targetMember = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Member not found." },
        { status: 404 },
      );
    }

    if (targetMember.userId === context.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove yourself from this organization.",
        },
        { status: 403 },
      );
    }

    if (isProtectedRole(targetMember.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Owner and Admin members cannot be removed here.",
        },
        { status: 403 },
      );
    }

    const requestHeaders = await headers();

    const permission = await auth.api.hasPermission({
      headers: requestHeaders,
      body: {
        permissions: {
          member: ["delete"],
        },
      },
    });

    if (!permission.success) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 },
      );
    }

    await auth.api.removeMember({
      headers: requestHeaders,
      body: {
        memberIdOrEmail: targetMember.userId,
        organizationId: context.organizationId,
      },
    });

    await createAuditLog({
      organizationId: context.organizationId,
      actorId: context.user.id,
      action: "MEMBER_REMOVED",
      entity: "Member",
      entityId: targetMember.id,
      description: `Removed ${targetMember.user.email} from the organization.`,
      metadata: {
        removedUserId: targetMember.userId,
        removedUserEmail: targetMember.user.email,
        previousRole: targetMember.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    console.error("Remove organization member failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to remove member." },
      { status: 500 },
    );
  }
}
