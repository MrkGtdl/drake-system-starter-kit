"use client";

import { useState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message || "Unable to sign out.");
      }

      window.location.replace("/sign-in");
    } catch (error) {
      console.error("Sign out failed:", error);
      setError("Unable to log out. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <LogOut size={16} />
        )}

        <span>{loading ? "Signing out..." : "Sign out"}</span>
      </button>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
