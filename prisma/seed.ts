import "dotenv/config";

import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const ORGANIZATION_NAME = "Starter Organization";
const ORGANIZATION_SLUG = "starter-organization";

// Development only. Change this before sharing the project.
const DEFAULT_DEV_PASSWORD = "Starter@12345";

const supervisorPermissions = {
  dashboard: ["read"],
  user: ["read"],
  role: ["read"],
  auditLog: ["read"],
  notification: ["read"],
};

const sampleUsers = [
  {
    name: "Platform Superadmin",
    email: "superadmin@example.com",
    platformRole: "superadmin",
  },
  {
    name: "Organization Admin",
    email: "org-admin@example.com",
    platformRole: "user",
  },
  {
    name: "Supervisor",
    email: "supervisor@example.com",
    platformRole: "user",
  },
  {
    name: "User",
    email: "user@example.com",
    platformRole: "user",
  },
] as const;

async function ensureSampleUser(sample: (typeof sampleUsers)[number]) {
  let user = await prisma.user.findUnique({
    where: { email: sample.email },
  });

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        name: sample.name,
        email: sample.email,
        password: DEFAULT_DEV_PASSWORD,
      },
    });

    user = await prisma.user.findUnique({
      where: { email: sample.email },
    });

    if (!user) {
      throw new Error(`Failed to create ${sample.email}`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        platformRole: sample.platformRole,
      },
    });

    console.info(`Created sample account: ${sample.email}`);
    return user.id;
  }

  if (user.platformRole !== sample.platformRole) {
    throw new Error(
      `${sample.email} already exists with platformRole "${user.platformRole}". Expected "${sample.platformRole}". No role changes were made.`,
    );
  }

  console.info(`Account already exists: ${sample.email}`);
  return user.id;
}

async function ensureOrganization() {
  const existing = await prisma.organization.findUnique({
    where: { slug: ORGANIZATION_SLUG },
  });

  if (existing) {
    if (existing.name !== ORGANIZATION_NAME) {
      throw new Error(
        `Organization slug "${ORGANIZATION_SLUG}" already exists with a different name.`,
      );
    }

    console.info(`Organization already exists: ${ORGANIZATION_NAME}`);
    return existing.id;
  }

  const organization = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: ORGANIZATION_NAME,
      slug: ORGANIZATION_SLUG,
      createdAt: new Date(),
    },
  });

  console.info(`Created organization: ${ORGANIZATION_NAME}`);
  return organization.id;
}

async function ensureSupervisorRole(organizationId: string) {
  const existing = await prisma.organizationRole.findFirst({
    where: {
      organizationId,
      role: "supervisor",
    },
  });

  if (existing) {
    let existingPermissions: unknown;

    try {
      existingPermissions = JSON.parse(existing.permission);
    } catch {
      throw new Error("Existing Supervisor role has invalid permission JSON.");
    }

    if (!isDeepStrictEqual(existingPermissions, supervisorPermissions)) {
      throw new Error(
        "Existing Supervisor permissions differ from the seed configuration. No changes were made.",
      );
    }

    console.info("Supervisor role already exists with matching permissions.");
    return;
  }

  await prisma.organizationRole.create({
    data: {
      id: randomUUID(),
      organizationId,
      role: "supervisor",
      permission: JSON.stringify(supervisorPermissions),
      createdAt: new Date(),
    },
  });

  console.info("Created Supervisor role.");
}

async function ensureMembership(
  organizationId: string,
  userId: string,
  role: "admin" | "supervisor" | "member",
) {
  const existing = await prisma.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (existing) {
    if (existing.role !== role) {
      throw new Error(
        `Existing membership for user ${userId} has role "${existing.role}". Expected "${role}". No changes were made.`,
      );
    }

    console.info(`Membership already exists: ${role}`);
    return;
  }

  await prisma.member.create({
    data: {
      id: randomUUID(),
      organizationId,
      userId,
      role,
      createdAt: new Date(),
    },
  });

  console.info(`Created organization membership: ${role}`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Sample seeding is disabled in production.");
  }

  console.info("Starting development seed...");

  const userIds = new Map<string, string>();

  for (const sample of sampleUsers) {
    const userId = await ensureSampleUser(sample);
    userIds.set(sample.email, userId);
  }

  const organizationId = await ensureOrganization();

  await ensureSupervisorRole(organizationId);

  await ensureMembership(
    organizationId,
    userIds.get("org-admin@example.com")!,
    "admin",
  );

  await ensureMembership(
    organizationId,
    userIds.get("supervisor@example.com")!,
    "supervisor",
  );

  await ensureMembership(
    organizationId,
    userIds.get("user@example.com")!,
    "member",
  );

  console.info("Development seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
