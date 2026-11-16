import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

import MembersClient from "@/components/dashboard/MembersClient";

async function canPerform(permission: { user: Array<"update" | "delete"> }) {
  try {
    await requirePermission(permission);
    return true;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return false;
    }

    throw error;
  }
}

export default async function MembersPage() {
  let context;

  try {
    context = await requirePermission({
      user: ["read"],
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view organization members.
          </p>
        </section>
      );
    }

    throw error;
  }

  const [members, canUpdate, canDelete] = await Promise.all([
    prisma.member.findMany({
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
    }),
    canPerform({ user: ["update"] }),
    canPerform({ user: ["delete"] }),
  ]);

  const initialMembers = members.map((member) => ({
    ...member,
    createdAt: member.createdAt.toISOString(),
  }));

  return (
    <MembersClient
      initialMembers={initialMembers}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}
