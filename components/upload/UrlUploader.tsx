"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ScreenSize = "DESKTOP" | "TABLET" | "MOBILE";

const SCREEN_SIZES: { id: ScreenSize; label: string; dims: string }[] = [
  { id: "DESKTOP", label: "Desktop", dims: "1512×900" },
  { id: "TABLET", label: "Tablet", dims: "768×1024" },
  { id: "MOBILE", label: "Mobile", dims: "390×844" },
];

interface UrlUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
}

export function UrlUploader({ defaultProjectId, onSuccess }: UrlUploaderProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [screenSize, setScreenSize] = useState<ScreenSize>("DESKTOP");
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
          screenSize,
          screenshotUrl: screenshotUrl ?? null,
          projectId: defaultProjectId ?? null,
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
        <label className="text-xs text-[var(--muted)] font-medium">URL *</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          type="url"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Screen size *</label>
        <div className="flex gap-2">
          {SCREEN_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScreenSize(s.id)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors text-left",
                screenSize === s.id
                  ? "border-[var(--foreground)] bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
              )}
            >
              <div>{s.label}</div>
              <div className="text-[10px] opacity-60">{s.dims}</div>
            </button>
          ))}
        </div>
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {status ?? "Add URL artifact"}
      </button>
    </div>
  );
}
