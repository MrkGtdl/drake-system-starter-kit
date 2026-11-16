"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Mail,
  Building2,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
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
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
  userRole: string;
};

export default function Sidebar({
  permissions,
  isSuperadmin,
  collapsed,
  onToggle,
  userName,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();

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
    <aside className="sticky top-16 flex h-[calc(100dvh-4rem)] w-full min-w-0 flex-col self-start border-r bg-background p-3">
      {/* Sidebar Header */}
      <div
        className={`mb-6 flex items-center ${
          collapsed ? "justify-center" : "justify-between px-2"
        }`}
      >
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </span>
        )}

        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1">
          {navigation
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex items-center rounded-xl py-2.5 text-sm transition-colors ${
                    collapsed ? "justify-center px-2" : "gap-3 px-3"
                  } ${
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-primary" />
                  )}

                  <Icon size={18} strokeWidth={1.8} />

                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* User Profile + Logout */}
      <div className="mt-4 shrink-0 border-t border-border pt-4">
        <div
          className={`flex items-center ${
            collapsed ? "flex-col gap-3" : "gap-2"
          }`}
        >
          {/* User Information */}
          <div
            className={`flex min-w-0 items-center ${
              collapsed ? "justify-center" : "flex-1 gap-2.5 px-1"
            }`}
            title={collapsed ? `${userName} · ${userRole}` : undefined}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
              <UserRound size={17} className="text-muted-foreground" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {userRole}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <div
            className={
              collapsed
                ? "[&_button]:!size-9 [&_button]:!justify-center [&_button]:!gap-0 [&_button]:!px-0 [&_button>span]:hidden [&_button>svg]:shrink-0 [&_p]:hidden"
                : "shrink-0"
            }
          >
            {/* Logout */}
            <div className="shrink-0">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
