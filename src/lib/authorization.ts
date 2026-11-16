import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppPermissions } from "@/lib/permissions";

export class AuthorizationError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

async function getAuthenticatedUser() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    throw new AuthorizationError(401, "Unauthorized");
  }

  // Always get the current platform role from the database.
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      platformRole: true,
    },
  });

  return {
    requestHeaders,
    session,
    isSuperadmin: user?.platformRole === "superadmin",
  };
}

export async function requirePermission(permissions: AppPermissions) {
  const { requestHeaders, session, isSuperadmin } =
    await getAuthenticatedUser();

  const organizationId = session.session.activeOrganizationId;

  // Organization-specific pages still require an active organization.
  if (!organizationId) {
    throw new AuthorizationError(403, "No active organization selected");
  }

  // Platform superadmins bypass organization-level permission checks.
  if (isSuperadmin) {
    return {
      user: session.user,
      session: session.session,
      organizationId,
    };
  }

  // Regular users must pass Better Auth permission checks.
  const result = await auth.api.hasPermission({
    headers: requestHeaders,
    body: {
      permissions,
    },
  });

  if (!result.success) {
    throw new AuthorizationError(403, "Insufficient permissions");
  }

  return {
    user: session.user,
    session: session.session,
    organizationId,
  };
}

export async function requireSuperadmin() {
  const { session, isSuperadmin } = await getAuthenticatedUser();

  if (!isSuperadmin) {
    throw new AuthorizationError(403, "Superadmin access required");
  }

  return {
    user: session.user,
    session: session.session,
  };
}
