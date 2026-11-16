import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-context";
import { AuthorizationError, requirePermission } from "@/lib/authorization";
import type { AppPermissions } from "@/lib/permissions";

export const instant = false;

async function canPerform(permissions: AppPermissions) {
  try {
    await requirePermission(permissions);
    return true;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return false;
    }

    throw error;
  }
}

export default async function DashboardPage() {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/sign-in");
  }

  if (!context.activeOrganization) {
    return (
      <main className="min-h-screen space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold">Select an organization</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an organization to access your dashboard.
          </p>
        </div>

        {context.organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t belong to any organization yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {context.organizations.map((organization) => (
              <li key={organization.id} className="rounded-lg border p-4">
                <p className="font-medium">{organization.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {organization.slug}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  const organizationId = context.activeOrganization.id;
  const userId = context.user.id;
  const now = new Date();

  const [
    canReadMembers,
    canReadInvitations,
    canReadNotifications,
    canReadAuditLogs,
  ] = await Promise.all([
    canPerform({ user: ["read"] }),
    canPerform({ invitation: ["read"] }),
    canPerform({ notification: ["read"] }),
    canPerform({ auditLog: ["read"] }),
  ]);

  const [
    memberCount,
    pendingInvitationCount,
    unreadNotificationCount,
    recentLogs,
    currentMembership,
  ] = await Promise.all([
    canReadMembers
      ? prisma.member.count({
          where: { organizationId },
        })
      : Promise.resolve(null),

    canReadInvitations
      ? prisma.invitation.count({
          where: {
            organizationId,
            status: "pending",
            expiresAt: { gt: now },
          },
        })
      : Promise.resolve(null),

    canReadNotifications
      ? prisma.notification.count({
          where: {
            userId,
            readAt: null,
            OR: [{ organizationId }, { organizationId: null }],
          },
        })
      : Promise.resolve(null),

    canReadAuditLogs
      ? prisma.auditLog.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            action: true,
            entity: true,
            description: true,
            createdAt: true,
            actor: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })
      : Promise.resolve([]),

    prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
      select: {
        role: true,
      },
    }),
  ]);

  const summaryCards = [
    ...(memberCount !== null
      ? [
          {
            title: "Total Members",
            value: memberCount,
            description: "People in this organization",
          },
        ]
      : []),

    ...(pendingInvitationCount !== null
      ? [
          {
            title: "Pending Invitations",
            value: pendingInvitationCount,
            description: "Invitations awaiting acceptance",
          },
        ]
      : []),

    ...(unreadNotificationCount !== null
      ? [
          {
            title: "Unread Notifications",
            value: unreadNotificationCount,
            description: "Notifications for your account",
          },
        ]
      : []),

    ...(canReadAuditLogs
      ? [
          {
            title: "Recent Activities",
            value: recentLogs.length,
            description: "Latest 5 recorded activities",
          },
        ]
      : []),
  ];

  const roleLabel = currentMembership?.role
    ? currentMembership.role
        .split(",")
        .map((role) => role.trim())
        .join(", ")
    : "Organization member";

  return (
    <main className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <section>
        <p className="text-sm text-muted-foreground">Dashboard</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {context.user.name}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Here&apos;s an overview of your organization.
        </p>
      </section>

      {/* Organization Overview */}
      <section className="rounded-lg border p-5">
        <p className="text-sm text-muted-foreground">Active Organization</p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {context.activeOrganization.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {context.activeOrganization.slug}
            </p>
          </div>

          <div className="w-fit rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Your role</p>
            <p className="text-sm font-medium capitalize">{roleLabel}</p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      {summaryCards.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.title} className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">{card.title}</p>

              <p className="mt-3 text-3xl font-bold tabular-nums">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {card.description}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border p-6 text-sm text-muted-foreground">
          No dashboard statistics are available for your current permissions.
        </section>
      )}

      {/* Recent Activity */}
      {canReadAuditLogs && (
        <section className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Recent Activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest organization activities
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {recentLogs.length} records
            </span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            <div className="divide-y">
              {recentLogs.map((log) => (
                <article key={log.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                        {log.action.replaceAll("_", " ")}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {log.entity}
                      </span>
                    </div>

                    <time
                      dateTime={log.createdAt.toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {log.createdAt.toLocaleString("en-PH")}
                    </time>
                  </div>

                  <p className="text-sm">
                    {log.description || `${log.action} — ${log.entity}`}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    By: {log.actor?.name || "System"}
                    {log.actor?.email ? ` (${log.actor.email})` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
