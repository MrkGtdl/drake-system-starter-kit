import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  ArrowRight,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-context";

import OrganizationSwitcher from "@/components/dashboard/OrganizationSwitcher";
import NotificationBell from "@/components/dashboard/NotificationBell";
import CreateOrganizationForm from "@/components/dashboard/CreateOrganizationForm";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SignOutButton from "@/components/dashboard/SignOutButton";

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-36 animate-pulse rounded-lg bg-muted sm:block" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>
      </header>

      <div className="px-5 pb-8 pt-24 sm:px-8">
        <div className="mb-8 h-6 w-48 animate-pulse rounded bg-muted" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>

        <div className="mt-8 h-64 animate-pulse rounded-2xl border bg-muted/40" />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <LayoutDashboard className="h-[18px] w-[18px]" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold tracking-tight">
          DRAKE Technologies
          {/* Development, Research, Automation, Knowledge & Engineering */}
        </p>

        <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
          Workspace platform
        </p>
      </div>
    </div>
  );
}

function UserProfile({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted">
        <UserRound className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="max-w-32 truncate text-sm font-medium">{name}</p>
        <p className="text-[11px] capitalize text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function OrganizationSelection({
  name,
  organizations,
  platformRole,
  isSuperadmin,
}: {
  name: string;
  organizations: {
    id: string;
    name: string;
  }[];
  platformRole: string;
  isSuperadmin: boolean;
}) {
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-8">
        <Brand />

        <div className="flex items-center gap-2 sm:gap-3">
          {isSuperadmin && (
            <CreateOrganizationForm compact platformRole={platformRole} />
          )}

          <UserProfile name={name} role={platformRole} />

          <div className="mx-1 h-7 w-px bg-border" />

          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/[0.04] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/[0.04] blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          {/* Introduction */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              {isSuperadmin ? (
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-primary" />
              )}

              {isSuperadmin ? "Platform administration" : "Workspace access"}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {isSuperadmin ? "Choose a workspace" : "Select your organization"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {isSuperadmin
                ? "Select an organization to manage its workspace, members, and settings."
                : `Welcome back, ${name}. Choose an organization to continue to your workspace.`}
            </p>
          </div>

          {/* Organizations */}
          {organizations.length > 0 ? (
            <section className="mt-10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Available organizations
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select an organization to continue.
                  </p>
                </div>

                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {organizations.length} available
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {organizations.map((organization) => (
                  <div
                    key={organization.id}
                    className="group rounded-2xl border bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                        <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </div>

                    <h3 className="mt-5 truncate font-semibold">
                      {organization.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Organization workspace
                    </p>

                    <div className="mt-5">
                      <OrganizationSwitcher
                        organizations={[organization]}
                        activeOrganizationId={null}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="mt-10 rounded-2xl border bg-background p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>

              <h2 className="mt-5 font-semibold">No organizations available</h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {isSuperadmin
                  ? "Create your first organization to get started."
                  : "You don't have access to an organization yet. Contact your platform administrator for assistance."}
              </p>

              {isSuperadmin && (
                <div className="mt-5 flex justify-center">
                  <CreateOrganizationForm platformRole={platformRole} />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-2 border-t pt-6 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure organization access
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}

async function DashboardContent({ children }: { children: React.ReactNode }) {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/sign-in");
  }

  const platformUser = await prisma.user.findUnique({
    where: {
      id: context.user.id,
    },
    select: {
      platformRole: true,
    },
  });

  const platformRole = platformUser?.platformRole ?? "user";
  const isSuperadmin = platformRole === "superadmin";

  // No active organization
  if (!context.activeOrganization) {
    return (
      <OrganizationSelection
        name={context.user.name}
        organizations={context.organizations}
        platformRole={platformRole}
        isSuperadmin={isSuperadmin}
      />
    );
  }

  const requestHeaders = await headers();

  const [
    dashboard,
    members,
    auditLogs,
    settings,
    invitations,
    notifications,
    notificationUpdates,
    notificationDeletes,
  ] = await Promise.all([
    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { dashboard: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { user: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { auditLog: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { setting: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { invitation: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { notification: ["read"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { notification: ["update"] } },
    }),

    auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { notification: ["delete"] } },
    }),
  ]);

  if (!dashboard.success && !isSuperadmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <ShieldCheck className="h-6 w-6 text-destructive" />
          </div>

          <h1 className="mt-5 text-xl font-bold">Access denied</h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You don&apos;t have permission to access the dashboard. Contact your
            organization administrator if you think this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <Brand />

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {notifications.success && (
            <NotificationBell
              canUpdate={notificationUpdates.success}
              canDelete={notificationDeletes.success}
            />
          )}

          <div className="hidden items-center gap-2 sm:flex">
            <OrganizationSwitcher
              organizations={context.organizations}
              activeOrganizationId={context.activeOrganization.id}
            />

            <CreateOrganizationForm compact platformRole={platformRole} />
          </div>

          <UserProfile
            name={context.user.name}
            role={isSuperadmin ? "Superadmin" : "Member"}
          />
        </div>
      </header>

      {/* Dashboard Content */}
      <DashboardShell
        isSuperadmin={isSuperadmin}
        permissions={{
          canReadDashboard: isSuperadmin || dashboard.success,
          canReadMembers: isSuperadmin || members.success,
          canReadAuditLogs: isSuperadmin || auditLogs.success,
          canReadSettings: isSuperadmin || settings.success,
          canReadInvitations: isSuperadmin || invitations.success,
        }}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
