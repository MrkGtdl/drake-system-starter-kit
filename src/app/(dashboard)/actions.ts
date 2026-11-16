"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { AuthorizationError, requireSuperadmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters.")
    .max(80, "Organization name is too long."),
});

export async function switchOrganization(formData: FormData) {
  const organizationId = formData.get("organizationId");

  if (typeof organizationId !== "string" || !organizationId) {
    redirect("/dashboard");
  }

  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Verify organization membership.
  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const isMember = organizations.some(
    (organization) => organization.id === organizationId,
  );

  if (!isMember) {
    redirect("/dashboard");
  }

  // Update the active organization in the current session.
  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: {
      organizationId,
    },
  });

  // Save the last selected organization for future logins.
  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      lastActiveOrganizationId: organizationId,
    },
  });

  redirect("/dashboard");
}

export async function createOrganization(formData: FormData) {
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid organization name.",
    };
  }

  // Only global Superadmins can create organizations.
  try {
    await requireSuperadmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.status === 401) {
        redirect("/sign-in");
      }

      return {
        error: "Only platform Superadmins can create organizations.",
      };
    }

    throw error;
  }

  const requestHeaders = await headers();

  const name = parsed.data.name;

  const baseSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const slug = `${baseSlug || "organization"}-${randomUUID().slice(0, 8)}`;

  try {
    await auth.api.createOrganization({
      headers: requestHeaders,
      body: {
        name,
        slug,
        keepCurrentActiveOrganization: false,
      },
    });
  } catch (error) {
    console.error("Organization creation failed:", error);

    return {
      error: "Unable to create organization. Please try again.",
    };
  }

  redirect("/dashboard");
}
