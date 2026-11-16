import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";

import { prisma } from "@/lib/prisma";
import { ac, owner, admin, member } from "@/lib/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Restore the user's last selected organization
  // whenever a new session is created.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: {
              id: session.userId,
            },
            select: {
              lastActiveOrganizationId: true,
            },
          });

          const organizationId = user?.lastActiveOrganizationId;

          if (!organizationId) {
            return {
              data: session,
            };
          }

          // Verify that the user is still a member.
          const membership = await prisma.member.findFirst({
            where: {
              userId: session.userId,
              organizationId,
            },
            select: {
              organizationId: true,
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },

  user: {
    additionalFields: {
      platformRole: {
        type: ["user", "superadmin"],
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,

    async sendResetPassword({ user, url }) {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Password reset email delivery is not configured.");
      }

      console.info("Development password reset", {
        email: user.email,
        resetUrl: url,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,

    async sendVerificationEmail({ user, url }) {
      if (
        process.env.NODE_ENV !== "development" &&
        process.env.SEEDING !== "true"
      ) {
        throw new Error("Email verification delivery is not configured.");
      }

      console.info("Development email verification", {
        email: user.email,
        verificationUrl: url,
      });
    },
  },

  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },

      requireEmailVerificationOnInvitation: true,

      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 25,
      },

      async sendInvitationEmail(data) {
        const inviteLink = new URL(
          `/accept-invitation/${data.id}`,
          process.env.BETTER_AUTH_URL,
        ).toString();

        if (process.env.NODE_ENV === "development") {
          console.info("Development organization invitation", {
            email: data.email,
            organization: data.organization.name,
            inviteLink,
          });
          return;
        }

        throw new Error("Invitation email delivery is not configured.");
      },
    }),
  ],
});
