"use client";

import { useState } from "react";
import Sidebar, {
  type SidebarPermissions,
} from "@/components/dashboard/Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  isSuperadmin: boolean;
  permissions: SidebarPermissions;
  userName: string;
  userRole: string;
};

export default function DashboardShell({
  children,
  isSuperadmin,
  permissions,
  userName,
  userRole,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="grid min-h-screen pt-16 transition-[grid-template-columns] duration-300 ease-in-out"
      style={{
        gridTemplateColumns: collapsed
          ? "4.5rem minmax(0, 1fr)"
          : "16rem minmax(0, 1fr)",
      }}
    >
      <Sidebar
        isSuperadmin={isSuperadmin}
        permissions={permissions}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        userName={userName}
        userRole={userRole}
      />

      <main className="min-w-0 p-6">{children}</main>
    </div>
  );
}
