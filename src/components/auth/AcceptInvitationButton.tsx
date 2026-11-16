"use client";

import { useState } from "react";

type Props = {
  invitationId: string;
};

export default function AcceptInvitationButton({ invitationId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAccept() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Unable to accept invitation.");
        return;
      }

      setMessage("Invitation accepted successfully!");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-lg bg-black px-5 py-3 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Accepting..." : "Accept Invitation"}
      </button>

      {message && (
        <p role="status" className="text-sm text-center">
          {message}
        </p>
      )}
    </div>
  );
}
