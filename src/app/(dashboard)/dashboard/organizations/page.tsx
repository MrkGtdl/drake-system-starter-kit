import { requireSuperadmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { switchOrganization } from "@/app/(dashboard)/actions";

import CreateOrganizationForm from "@/components/dashboard/CreateOrganizationForm";
import { ArrowLeftRight, Building2, Check } from "lucide-react";

export default async function OrganizationsPage() {
  const { session } = await requireSuperadmin();

  const activeOrganizationId = session.activeOrganizationId ?? null;

  const organizations = await prisma.organization.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage and switch between organizations across your platform.
          </p>
        </div>

        <CreateOrganizationForm platformRole="superadmin" />
      </div>

      {/* Organization List */}
      <div className="overflow-hidden rounded-xl border bg-background">
        {/* List Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Organization List</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {organizations.length}{" "}
              {organizations.length === 1 ? "organization" : "organizations"}{" "}
              registered
            </p>
          </div>
        </div>

        {/* Empty State */}
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">No organizations found</h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first organization to get started.
            </p>
          </div>
        ) : (
          /* Organization Rows */
          <div className="divide-y">
            {organizations.map((organization) => {
              const isActive = organization.id === activeOrganizationId;

              return (
                <div
                  key={organization.id}
                  className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Organization Details */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {organization.name}
                        </p>

                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {organization.slug}
                      </p>
                    </div>
                  </div>

                  {/* Organization Action */}
                  <div className="shrink-0">
                    {isActive ? (
                      <span className="inline-flex h-9 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-xs font-medium text-muted-foreground">
                        <Check className="h-3.5 w-3.5" />
                        Current organization
                      </span>
                    ) : (
                      <form action={switchOrganization}>
                        <input
                          type="hidden"
                          name="organizationId"
                          value={organization.id}
                        />

                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          Switch organization
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
