"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  canUpdate: boolean;
};

const categories = [
  { value: "general", label: "General" },
  { value: "company", label: "Company" },
  { value: "branding", label: "Branding" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security" },
] as const;

export default function SettingsForm({ canUpdate }: SettingsFormProps) {
  const router = useRouter();

  const [key, setKey] = useState("");
  const [category, setCategory] = useState("general");
  const [value, setValue] = useState("{\n  \n}");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const normalizedKey = key.trim();
    const normalizedDescription = description.trim();

    if (!normalizedKey) {
      setMessageType("error");
      setMessage("Setting key is required.");
      return;
    }

    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(value);
    } catch {
      setMessageType("error");
      setMessage("Invalid JSON value. Please check your syntax.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: normalizedKey,
          category,
          value: parsedValue,
          description: normalizedDescription || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(result.error || "Unable to save setting.");
        return;
      }

      setMessageType(result.auditLogRecorded === false ? "error" : "success");
      setMessage(result.message || "Setting saved successfully.");

      setKey("");
      setCategory("general");
      setValue("{\n  \n}");
      setDescription("");

      router.refresh();
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!canUpdate) {
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access to organization settings.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <label htmlFor="setting-key" className="text-sm font-medium">
          Setting key
        </label>

        <input
          id="setting-key"
          required
          maxLength={100}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="e.g. company_name"
          disabled={loading}
          className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="setting-category" className="text-sm font-medium">
          Category
        </label>

        <select
          id="setting-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={loading}
          className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring disabled:opacity-50"
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="setting-value" className="text-sm font-medium">
          JSON value
        </label>

        <textarea
          id="setting-value"
          required
          rows={6}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={loading}
          spellCheck={false}
          className="w-full rounded-md border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-ring disabled:opacity-50"
        />

        <p className="text-xs text-muted-foreground">
          Enter a valid JSON object, array, string, number, or boolean.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="setting-description" className="text-sm font-medium">
          Description
        </label>

        <textarea
          id="setting-description"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what this setting controls"
          disabled={loading}
          className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring disabled:opacity-50"
        />
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${
            messageType === "error" ? "text-destructive" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save setting"}
      </button>
    </form>
  );
}
