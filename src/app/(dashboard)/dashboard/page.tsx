import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-context";
import { switchOrganization } from "@/app/(dashboard)/actions";
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

  // Organization selection
  if (!context.activeOrganization) {
    return (
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-muted/20 px-4 py-10 sm:px-6 lg:px-8">
        {/* Background accents */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/[0.04] blur-3xl" />

        <div className="relative mx-auto max-w-4xl space-y-8">
          {/* Heading */}
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm">
              <Building2 className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Workspace selection
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Choose your organization
              </h1>

              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Welcome back, {context.user.name}. Select an organization below
                to continue to your workspace.
              </p>
            </div>
          </div>

          {/* Organization list */}
          {context.organizations.length === 0 ? (
            <section className="rounded-2xl border bg-background p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                No organizations found
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                You are not currently a member of any organization. Contact your
                administrator to get access.
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Available organizations</h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select where you want to work.
                  </p>
                </div>

                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {context.organizations.length}{" "}
                  {context.organizations.length === 1
                    ? "organization"
                    : "organizations"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {context.organizations.map((organization) => (
                  <article
                    key={organization.id}
                    className="group flex flex-col justify-between rounded-2xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/60 transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                          <Building2 className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>

                        <ShieldCheck className="h-4 w-4 text-muted-foreground/50" />
                      </div>

                      <h3 className="mt-5 text-lg font-semibold tracking-tight">
                        {organization.name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {organization.slug}
                      </p>
                    </div>

                    <form action={switchOrganization} className="mt-6">
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organization.id}
                      />

                      <button
                        type="submit"
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99]"
                      >
                        Continue to workspace
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="border-t pt-5">
            <p className="text-center text-xs text-muted-foreground">
              Your organization access is protected by your account permissions.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Active organization dashboard
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
            icon: Users,
          },
        ]
      : []),

    ...(pendingInvitationCount !== null
      ? [
          {
            title: "Pending Invitations",
            value: pendingInvitationCount,
            description: "Invitations awaiting acceptance",
            icon: Clock3,
          },
        ]
      : []),

    ...(unreadNotificationCount !== null
      ? [
          {
            title: "Unread Notifications",
            value: unreadNotificationCount,
            description: "Notifications for your account",
            icon: Bell,
          },
        ]
      : []),

    ...(canReadAuditLogs
      ? [
          {
            title: "Recent Activities",
            value: recentLogs.length,
            description: "Latest 5 recorded activities",
            icon: Activity,
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
      <section className="rounded-2xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Active Organization</p>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Building2 className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {context.activeOrganization.name}
              </h2>

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {context.activeOrganization.slug}
              </p>
            </div>
          </div>

          <div className="w-fit rounded-lg border bg-muted/40 px-4 py-2">
            <p className="text-xs text-muted-foreground">Your role</p>

            <p className="text-sm font-medium capitalize">{roleLabel}</p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      {summaryCards.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-2xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">
                  {card.value}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
          No dashboard statistics are available for your current permissions.
        </section>
      )}

      {/* Recent Activity */}
      {canReadAuditLogs && (
        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Recent Activity</h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Latest organization activities
              </p>
            </div>

            <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              {recentLogs.length} records
            </span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />

              <p className="mt-3 text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentLogs.map((log) => (
                <article
                  key={log.id}
                  className="space-y-2 px-5 py-4 transition-colors hover:bg-muted/20"
                >
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
