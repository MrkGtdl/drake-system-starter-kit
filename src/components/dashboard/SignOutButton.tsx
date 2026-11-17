"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, LoaderCircle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, loading]);

  function closeModal() {
    if (loading) return;

    setIsOpen(false);
    setError("");
  }

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
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Logout Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Sign out"
        aria-label="Sign out"
        className="group flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
      >
        <LogOut
          size={17}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>

      {/* Confirmation Modal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              aria-describedby="logout-description"
              className="relative my-auto w-full max-w-[420px] overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            >
              {/* Top Accent */}
              <div className="h-1 w-full bg-muted-foreground/20" />

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                aria-label="Close confirmation"
                className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X size={18} />
              </button>

              <div className="p-6 sm:p-7">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
                    <ShieldAlert size={27} strokeWidth={1.7} />
                  </div>
                </div>

                {/* Heading */}
                <div className="mt-6 space-y-2">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Account session
                  </p>

                  <h2
                    id="logout-title"
                    className="text-center text-2xl font-bold tracking-tight"
                  >
                    Sign out of your account?
                  </h2>

                  <p
                    id="logout-description"
                    className="text-center text-sm leading-6 text-muted-foreground"
                  >
                    You are about to end your current session. You will need to
                    sign in again to access your workspace.
                  </p>
                </div>

                {/* Information */}
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                    <LogOut size={16} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Your session will end</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Your account and workspace data will remain unchanged.
                    </p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={loading}
                    className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Signing out
                      </>
                    ) : (
                      <>
                        Sign out
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>
                </div>

                {/* Footer */}
                <p className="mt-5 text-center text-[11px] text-muted-foreground">
                  DRAKE Technologies · Secure workspace
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
