"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, X, Building2, LoaderCircle, AlertCircle } from "lucide-react";

import { createOrganization } from "@/app/(dashboard)/actions";

type Props = {
  compact?: boolean;
  platformRole: string;
};

export default function CreateOrganizationForm({
  compact = true,
  platformRole,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (platformRole !== "superadmin") {
    return null;
  }

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");

    startTransition(async () => {
      const result = await createOrganization(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        form.reset();
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      {/* Add Organization Button */}
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        className="group inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <Plus
          size={16}
          className="transition-transform group-hover:rotate-90"
        />
        Add organization
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-organization-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 size={21} strokeWidth={1.8} />
                </div>

                <div className="space-y-1">
                  <h2
                    id="create-organization-title"
                    className="text-base font-semibold tracking-tight"
                  >
                    Create organization
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Set up a new workspace for your team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <label
                  htmlFor="organization-name"
                  className="block text-sm font-medium"
                >
                  Organization name
                  <span className="ml-1 text-destructive">*</span>
                </label>

                <input
                  id="organization-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="e.g. Acme Corporation"
                  autoFocus
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="text-xs text-muted-foreground">
                  Enter the official or preferred name of your organization.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="h-10 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create organization
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
