import { prisma } from "@/lib/prisma";

export type NotificationType = "info" | "success" | "warning" | "error";

export type CreateNotificationInput = {
  organizationId?: string | null;
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
  metadata?: Record<string, unknown>;
};

function toNotificationData(input: CreateNotificationInput) {
  return {
    organizationId: input.organizationId ?? null,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    link: input.link ?? null,
    metadata: input.metadata
      ? JSON.parse(JSON.stringify(input.metadata))
      : undefined,
  };
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: toNotificationData(input),
  });
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: inputs.map(toNotificationData),
  });
}
