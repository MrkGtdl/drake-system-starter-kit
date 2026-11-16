import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { AuthorizationError, requirePermission } from "@/lib/authorization";

const settingCategories = [
  "general",
  "company",
  "branding",
  "notifications",
  "security",
] as const;

const updateSettingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z
    .unknown()
    .refine(
      (value) => value !== null && value !== undefined,
      "A non-null JSON value is required",
    ),
  category: z.enum(settingCategories).default("general"),
  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((value) => value || null),
});

function handleAuthorizationError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }

  return null;
}

export async function GET() {
  try {
    const context = await requirePermission({
      setting: ["read"],
    });

    const settings = await prisma.systemSetting.findMany({
      where: {
        organizationId: context.organizationId,
      },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    const authorizationResponse = handleAuthorizationError(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("Fetch settings failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requirePermission({
      setting: ["update"],
    });

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const validation = updateSettingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid setting data",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { key, value, category, description } = validation.data;

    let serializedValue: string | undefined;

    try {
      serializedValue = JSON.stringify(value);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON value" },
        { status: 400 },
      );
    }

    if (serializedValue === undefined) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON value" },
        { status: 400 },
      );
    }

    const jsonValue = JSON.parse(serializedValue);

    const setting = await prisma.systemSetting.upsert({
      where: {
        organizationId_key: {
          organizationId: context.organizationId,
          key,
        },
      },
      create: {
        organizationId: context.organizationId,
        key,
        value: jsonValue,
        category,
        description,
      },
      update: {
        value: jsonValue,
        category,
        description,
      },
    });

    let auditLogRecorded = true;

    try {
      await createAuditLog({
        organizationId: context.organizationId,
        actorId: context.user.id,
        action: "SETTING_UPDATED",
        entity: "SystemSetting",
        entityId: setting.id,
        description: `Setting "${key}" was updated`,
        metadata: {
          key,
          category,
        },
      });
    } catch (auditError) {
      auditLogRecorded = false;
      console.error("Setting saved, but audit logging failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: auditLogRecorded
        ? "Setting saved successfully"
        : "Setting saved, but the activity log could not be recorded",
      auditLogRecorded,
      data: setting,
    });
  } catch (error) {
    const authorizationResponse = handleAuthorizationError(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("Update setting failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save setting" },
      { status: 500 },
    );
  }
}
