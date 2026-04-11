"use client";

import { useState } from "react";

interface FigmaUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
}

export function FigmaUploader({ defaultProjectId, onSuccess }: FigmaUploaderProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!figmaUrl.trim() || !name.trim()) {
      setError("Figma URL and name are required.");
      return;
    }

    if (!figmaUrl.includes("figma.com")) {
      setError("Please enter a valid Figma URL.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Attempt to get a static preview via Figma REST API
      // (server-side, uses FIGMA_SERVICE_TOKEN)
      let figmaPreviewUrl: string | undefined;
      let figmaNodeWidth: number | undefined;
      let figmaNodeHeight: number | undefined;
      try {
        const previewRes = await fetch("/api/figma-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figmaUrl }),
        });
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          figmaPreviewUrl = previewData.previewUrl;
          if (previewData.width) figmaNodeWidth = previewData.width;
          if (previewData.height) figmaNodeHeight = previewData.height;
        }
      } catch {
        // Preview fetch failed — continue without it
      }

      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          type: "FIGMA",
          figmaUrl,
          figmaPreviewUrl,
          figmaNodeWidth,
          figmaNodeHeight,
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
      <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3">
        <p className="text-xs text-[var(--muted)]">
          Paste a Figma file or prototype link. We&apos;ll embed it with the Figma Embed API and generate a static preview as fallback.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Figma URL *</label>
        <input
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="https://www.figma.com/file/…"
          type="url"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Figma design"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this design show?"
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
        {submitting ? "Saving…" : "Add Figma artifact"}
      </button>
    </div>
  );
}
