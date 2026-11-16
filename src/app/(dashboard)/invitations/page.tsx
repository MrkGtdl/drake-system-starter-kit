import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";
import InvitationsClient from "@/components/dashboard/InvitationsClient";

async function canPerform(permission: {
  invitation: Array<"create" | "cancel">;
}) {
  try {
    await requirePermission(permission);
    return true;
  } catch (error) {
    if (error instanceof AuthorizationError) return false;
    throw error;
  }
}

export default async function InvitationsPage() {
  let context;

  try {
    context = await requirePermission({
      invitation: ["read"],
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view organization invitations.
          </p>
        </section>
      );
    }

    throw error;
  }

  const [invitations, canCreate, canCancel] = await Promise.all([
    prisma.invitation.findMany({
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
    }),
    canPerform({ invitation: ["create"] }),
    canPerform({ invitation: ["cancel"] }),
  ]);

  const initialInvitations = invitations.map((invitation) => ({
    ...invitation,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
  }));

  return (
    <InvitationsClient
      initialInvitations={initialInvitations}
      canCreate={canCreate}
      canCancel={canCancel}
    />
  );
}
