"use client";

import { FormEvent, useState } from "react";
import { RefreshCw, Send, X } from "lucide-react";

type Invitation = {
  email: string;
  role: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
};

type InvitationsClientProps = {
  initialInvitations: Invitation[];
  canCreate: boolean;
  canCancel: boolean;
};

export default function InvitationsClient({
  initialInvitations,
  canCreate,
  canCancel,
}: InvitationsClientProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refreshInvitations() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/invitations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load invitations");
      }

      setInvitations(result.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load invitations",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate || loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create invitation");
      }

      setEmail("");
      setMessage("Invitation created successfully.");
      await refreshInvitations();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create invitation",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelInvitation(invitationEmail: string) {
    if (!canCancel || loading) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel the invitation for ${invitationEmail}?`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/invitations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: invitationEmail }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to cancel invitation");
      }

      setMessage("Invitation cancelled successfully.");
      await refreshInvitations();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to cancel invitation",
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatus(invitation: Invitation) {
    if (
      invitation.status === "pending" &&
      new Date(invitation.expiresAt) <= new Date()
    ) {
      return "Expired";
    }

    return invitation.status;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite people to join your organization and manage their invitations.
        </p>
      </div>

      {canCreate && (
        <div className="rounded-lg border">
          <div className="border-b px-5 py-4">
            <h2 className="font-medium">Invite a member</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an organization invitation by email. New members are assigned
              the Member role.
            </p>
          </div>

          <form
            onSubmit={handleCreateInvitation}
            className="flex flex-col gap-3 p-5 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-4" />
              {loading ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </div>
      )}

      {(error || message) && (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-medium">Organization invitations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent invitations sent by your organization.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshInvitations}
            disabled={refreshing}
            aria-label="Refresh invitations"
            className="inline-flex size-9 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No invitations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Sent</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  {canCancel && (
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y">
                {invitations.map((invitation) => {
                  const status = getStatus(invitation);
                  const isPending = status === "pending";

                  return (
                    <tr key={`${invitation.email}-${invitation.createdAt}`}>
                      <td className="px-5 py-4 font-medium">
                        {invitation.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize">
                          {invitation.role ?? "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                            status === "pending"
                              ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                              : status === "accepted"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : status === "Expired"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </td>

                      {canCancel && (
                        <td className="px-5 py-4 text-right">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelInvitation(invitation.email)
                              }
                              disabled={loading}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <X className="size-3.5" />
                              Cancel
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
