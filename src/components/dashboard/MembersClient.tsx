"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Trash2, Users } from "lucide-react";

type Member = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type MembersClientProps = {
  initialMembers: Member[];
  canUpdate: boolean;
  canDelete: boolean;
};

function isProtectedRole(role: string) {
  const roles = role.split(",").map((item) => item.trim());
  return roles.includes("owner") || roles.includes("admin");
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function MembersClient({
  initialMembers,
  canUpdate,
  canDelete,
}: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(query) ||
        member.user.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query),
    );
  }, [members, search]);

  async function refreshMembers() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/members", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load members.");
      }

      setMembers(
        result.data.map((member: Member) => ({
          ...member,
          createdAt: new Date(member.createdAt).toISOString(),
        })),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load members.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRoleChange(member: Member, role: string) {
    if (!canUpdate || loadingId) return;
    if (!["member", "supervisor"].includes(role)) return;

    setLoadingId(member.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: member.id,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update member role.");
      }

      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, role } : item,
        ),
      );

      setMessage(`${member.user.name}'s role was updated successfully.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update member role.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemoveMember(member: Member) {
    if (!canDelete || loadingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.user.name} (${member.user.email}) from this organization?`,
    );

    if (!confirmed) return;

    setLoadingId(member.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: member.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to remove member.");
      }

      setMembers((current) => current.filter((item) => item.id !== member.id));

      setMessage(`${member.user.name} was removed from the organization.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to remove member.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage members of your organization.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Organization members</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {members.length} {members.length === 1 ? "member" : "members"} in
              this organization
            </p>
          </div>

          <button
            type="button"
            onClick={refreshMembers}
            disabled={refreshing || Boolean(loadingId)}
            aria-label="Refresh members"
            className="inline-flex size-9 items-center justify-center self-end rounded-md border transition-colors hover:bg-muted disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or role..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {(error || message) && (
          <div
            role="status"
            className={`border-b px-5 py-3 text-sm ${
              error
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400"
            }`}
          >
            {error || message}
          </div>
        )}

        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="font-medium">
              {search ? "No matching members" : "No members found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different name, email, or role."
                : "There are no members in this organization yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  {(canUpdate || canDelete) && (
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredMembers.map((member) => {
                  const protectedMember = isProtectedRole(member.role);
                  const busy = loadingId === member.id;

                  return (
                    <tr key={member.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt=""
                              className="size-10 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {getInitials(member.user.name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {member.user.name}
                            </p>
                            <p className="truncate text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {canUpdate && !protectedMember ? (
                          <select
                            value={member.role}
                            onChange={(event) =>
                              handleRoleChange(member, event.target.value)
                            }
                            disabled={Boolean(loadingId)}
                            aria-label={`Change role for ${member.user.name}`}
                            className="h-9 rounded-md border bg-background px-2 text-xs capitalize outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="supervisor">Supervisor</option>
                          </select>
                        ) : (
                          <span className="inline-flex rounded-md bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                            {member.role}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>

                      {(canUpdate || canDelete) && (
                        <td className="px-5 py-4 text-right">
                          {canDelete && !protectedMember && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              disabled={Boolean(loadingId)}
                              aria-label={`Remove ${member.user.name}`}
                              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" />
                              {busy ? "Processing..." : "Remove"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
