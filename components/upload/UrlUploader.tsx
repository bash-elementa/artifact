"use client";

import { useState } from "react";

interface UrlUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

export function UrlUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: UrlUploaderProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<"work" | "inspo" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!url.trim() || !name.trim()) {
      setError("URL and name are required.");
      return;
    }

    let validUrl: string;
    try {
      validUrl = new URL(url).toString();
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      setStatus("Capturing screenshot…");
      let screenshotUrl: string | undefined;
      try {
        const resp = await fetch(`/api/screenshot?url=${encodeURIComponent(validUrl)}`);
        if (resp.ok) {
          const data = await resp.json();
          screenshotUrl = data.url;
        }
      } catch {
        // screenshot is optional — continue without it
      }

      setStatus("Saving…");
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          type: "URL",
          websiteUrl: validUrl,
          screenSize: "DESKTOP",
          screenshotUrl: screenshotUrl ?? null,
          projectId: defaultProjectId ?? null,
          tags: tag ? [tag] : [],
        }),
      });

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
      setStatus(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Website URL *</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          type="url"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
        <p className="text-xs text-[var(--muted)] opacity-70">
          ⚠︎ Not all websites can be previewed — some block embedding.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My website"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
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

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Category *</label>
        <div className="flex gap-2">
          {(["work", "inspo"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTag(t)}
              className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors"
              style={tag === t
                ? { background: "var(--accent)", color: "var(--accent-fg)", border: "1px solid transparent" }
                : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {t === "work" ? "Work" : "Inspo"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {projectSelector}

      <button
        onClick={handleSubmit}
        disabled={submitting || !tag || submitDisabled}
        className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {status ?? "Add website artifact"}
      </button>
    </div>
  );
}
