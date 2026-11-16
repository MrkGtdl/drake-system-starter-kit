import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
    select: { id: true },
  });

  const organization = await prisma.organization.findUnique({
    where: { slug: "starter-organization" },
    select: { id: true },
  });

  if (!user || !organization) {
    throw new Error("Test user or organization not found");
  }

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      title: "Test Notification",
      message: "This is a test notification.",
      type: "info",
    },
  });

  console.log("Notification created:", {
    id: notification.id,
    title: notification.title,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
