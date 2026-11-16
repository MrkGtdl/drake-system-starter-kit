import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getDashboardContext() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return null;
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const activeOrganizationId = session.session.activeOrganizationId;

  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeOrganizationId,
    ) ?? null;

  return {
    user: session.user,
    session: session.session,
    organizations,
    activeOrganization,
  };
}
