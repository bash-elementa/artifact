"use client";

import { useState } from "react";

interface HtmlUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

export function HtmlUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: HtmlUploaderProps) {
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!html.trim()) {
      setError("HTML content is required.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          type: "HTML",
          htmlContent: html,
          projectId: defaultProjectId ?? null,
        }),
      });

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My report"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">HTML *</label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste your HTML here…"
          rows={8}
          spellCheck={false}
          className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)] font-mono"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this?"
          rows={2}
          className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {projectSelector}

      <button
        onClick={handleSubmit}
        disabled={submitting || submitDisabled}
        className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? "Saving…" : "Add HTML"}
      </button>
    </div>
  );
}
