import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requirePermission } from "@/lib/authorization";
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  let context;

  try {
    context = await requirePermission({
      setting: ["read"],
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view organization settings.
          </p>
        </section>
      );
    }

    throw error;
  }

  const requestHeaders = await headers();

  const permission = await auth.api.hasPermission({
    headers: requestHeaders,
    body: {
      permissions: {
        setting: ["update"],
      },
    },
  });

  const settings = await prisma.systemSetting.findMany({
    where: {
      organizationId: context.organizationId,
    },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure preferences for your organization.
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <h2 className="mb-5 font-medium">Add or update setting</h2>

        <SettingsForm canUpdate={permission.success} />
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-5 py-4">
          <h2 className="font-medium">Existing settings</h2>
        </div>

        {settings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No settings have been configured yet.
          </div>
        ) : (
          <div className="divide-y">
            {settings.map((setting) => (
              <article key={setting.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{setting.key}</h3>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs capitalize">
                    {setting.category}
                  </span>
                </div>

                {setting.description && (
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                )}

                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(setting.value, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
