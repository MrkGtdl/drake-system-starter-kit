import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardContext } from "@/lib/dashboard-context";

import OrganizationSwitcher from "@/components/dashboard/OrganizationSwitcher";
import NotificationBell from "@/components/dashboard/NotificationBell";
import CreateOrganizationForm from "@/components/dashboard/CreateOrganizationForm";
import DashboardShell from "@/components/dashboard/DashboardShell";

function DashboardLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-20 animate-pulse rounded-lg bg-muted" />
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

  // Superadmin without an active organization
  if (!context.activeOrganization) {
    if (isSuperadmin) {
      return (
        <div className="min-h-screen bg-background text-foreground">
          {/* Fixed Header */}
          <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="font-semibold tracking-tight">
              System Starter Kit
            </div>

            <div className="flex items-center gap-4">
              {context.organizations.length > 0 && (
                <OrganizationSwitcher
                  organizations={context.organizations}
                  activeOrganizationId={null}
                />
              )}

              <CreateOrganizationForm compact platformRole={platformRole} />

              <span className="text-sm text-muted-foreground">
                {context.user.name}
              </span>
            </div>
          </header>

          {/* Dashboard Shell */}
          <DashboardShell
            isSuperadmin
            permissions={{
              canReadDashboard: true,
              canReadMembers: true,
              canReadAuditLogs: true,
              canReadSettings: true,
              canReadInvitations: true,
            }}
          >
            <div className="min-w-0">{children}</div>
          </DashboardShell>
        </div>
      );
    }

    // Regular users must select an organization
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">Select an organization</h1>

        <p className="mt-2 text-muted-foreground">
          Choose an existing workspace or contact your platform administrator if
          you need access to an organization.
        </p>

        <div className="mt-6 flex max-w-md flex-col gap-4">
          {context.organizations.length > 0 && (
            <OrganizationSwitcher
              organizations={context.organizations}
              activeOrganizationId={null}
            />
          )}

          <CreateOrganizationForm platformRole={platformRole} />
        </div>
      </div>
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
      <div className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>

        <p className="mt-2 text-muted-foreground">
          You don&apos;t have permission to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 flex-wrap items-center justify-between gap-4 border-b bg-background px-6">
        <div className="font-semibold tracking-tight">System Starter Kit</div>

        <div className="flex flex-wrap items-center gap-4">
          {notifications.success && (
            <NotificationBell
              canUpdate={notificationUpdates.success}
              canDelete={notificationDeletes.success}
            />
          )}

          <div className="relative flex items-center gap-2">
            <OrganizationSwitcher
              organizations={context.organizations}
              activeOrganizationId={context.activeOrganization.id}
            />

            <CreateOrganizationForm compact platformRole={platformRole} />
          </div>

          <span className="text-sm text-muted-foreground">
            {context.user.name}
          </span>
        </div>
      </header>

      {/* Collapsible Dashboard Layout */}
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
