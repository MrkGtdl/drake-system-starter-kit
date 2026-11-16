"use client";

import { useMemo, useState } from "react";
import { Search, ClipboardList, FilterX } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  } | null;
};

type AuditLogsClientProps = {
  initialLogs: AuditLog[];
};

function formatAction(action: string) {
  return action.replaceAll("_", " ");
}

export default function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const actions = useMemo(
    () => [...new Set(initialLogs.map((log) => log.action))].sort(),
    [initialLogs],
  );

  const entities = useMemo(
    () => [...new Set(initialLogs.map((log) => log.entity))].sort(),
    [initialLogs],
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialLogs.filter((log) => {
      const matchesSearch =
        !query ||
        [
          log.action,
          log.entity,
          log.description ?? "",
          log.entityId ?? "",
          log.actor?.name ?? "",
          log.actor?.email ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      const matchesEntity =
        entityFilter === "all" || log.entity === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [initialLogs, search, actionFilter, entityFilter]);

  const hasFilters =
    search.trim() !== "" || actionFilter !== "all" || entityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review activity and changes within your organization.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-medium">Recent activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {filteredLogs.length} of {initialLogs.length} records
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activity..."
                aria-label="Search audit logs"
                className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring sm:w-56"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              aria-label="Filter by action"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="all">All actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              aria-label="Filter by entity"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="all">All entities</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
            {hasFilters ? (
              <>
                <FilterX size={28} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No matching activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try changing your search or filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <ClipboardList size={28} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No activity recorded</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Organization activity will appear here.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredLogs.map((log) => (
              <article key={log.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                      {formatAction(log.action)}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {log.entity}
                    </span>
                  </div>

                  <time
                    dateTime={log.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>

                <p className="text-sm">
                  {log.description || `${log.action} — ${log.entity}`}
                </p>

                <p className="text-xs text-muted-foreground">
                  By: {log.actor?.name || "System"}
                  {log.actor?.email ? ` (${log.actor.email})` : ""}
                </p>

                {log.entityId && (
                  <p className="break-all text-xs text-muted-foreground">
                    Reference: {log.entityId}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
