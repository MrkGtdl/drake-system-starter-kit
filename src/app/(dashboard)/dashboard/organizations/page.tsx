import { requireSuperadmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function OrganizationsPage() {
  await requireSuperadmin();

  const organizations = await prisma.organization.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Manage organizations across your platform.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 font-medium">Organization List</div>

        {organizations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No organizations found.
          </p>
        ) : (
          <div className="divide-y">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex flex-col gap-1 px-4 py-3"
              >
                <p className="font-medium">{organization.name}</p>
                <p className="text-sm text-muted-foreground">
                  {organization.slug}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
