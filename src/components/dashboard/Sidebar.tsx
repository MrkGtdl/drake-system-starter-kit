import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Mail,
  Building2,
} from "lucide-react";

import SignOutButton from "@/components/dashboard/SignOutButton";

type SidebarProps = {
  isSuperadmin: boolean;
  permissions: {
    canReadDashboard: boolean;
    canReadMembers: boolean;
    canReadAuditLogs: boolean;
    canReadSettings: boolean;
    canReadInvitations: boolean;
  };
};

export default function Sidebar({ permissions, isSuperadmin }: SidebarProps) {
  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      visible: permissions.canReadDashboard,
    },
    {
      label: "Members",
      href: "/members",
      icon: Users,
      visible: permissions.canReadMembers,
    },
    {
      label: "Organizations",
      href: "/dashboard/organizations",
      icon: Building2,
      visible: isSuperadmin,
    },
    {
      label: "Invitations",
      href: "/invitations",
      icon: Mail,
      visible: permissions.canReadInvitations,
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: ClipboardList,
      visible: permissions.canReadAuditLogs,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      visible: permissions.canReadSettings,
    },
  ];

  return (
    <aside className="sticky top-16 flex h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col self-start border-r bg-background p-4">
      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Fixed bottom logout area */}
      <div className="mt-4 shrink-0 border-t pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
