"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import { createOrganization } from "@/app/(dashboard)/actions";

type Props = {
  compact?: boolean;
  platformRole: string;
};

export default function CreateOrganizationForm({
  compact = false,
  platformRole,
}: Props) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Only show this component to platform Superadmins.
  if (platformRole !== "superadmin") {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setError("");

    startTransition(async () => {
      const result = await createOrganization(formData);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  if (compact && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus size={16} />
        Create
      </button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Create organization</h2>
          <p className="text-sm text-muted-foreground">
            Set up a new workspace for your team.
          </p>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError("");
            }}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="organization-name"
            className="mb-1.5 block text-sm font-medium"
          >
            Organization name
          </label>

          <input
            id="organization-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Acme Corporation"
            disabled={isPending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          {isPending ? "Creating..." : "Create organization"}
        </button>
      </form>
    </div>
  );
}
