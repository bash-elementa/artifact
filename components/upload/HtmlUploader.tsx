"use client";

import { useState, useCallback } from "react";
import { TAG_CONFIG } from "@/lib/tag-config";

interface HtmlUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

export function HtmlUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: HtmlUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<"work" | "inspo" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function acceptFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".html") && f.type !== "text/html") {
      setError("Please select a .html file.");
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.html$/i, ""));
    setError(null);
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name]
  );

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  async function handleSubmit() {
    if (!file || !name.trim()) {
      setError("Please select a file and enter a name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      setStatus("Uploading HTML file…");
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload/media", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url, size } = await uploadRes.json();

      setStatus("Capturing preview…");
      let screenshotUrl: string | undefined;
      try {
        const ssRes = await fetch(`/api/screenshot?url=${encodeURIComponent(url)}`);
        if (ssRes.ok) {
          const ssData = await ssRes.json();
          screenshotUrl = ssData.url;
        }
      } catch {
        // screenshot is optional — continue without it
      }

      setStatus("Saving…");
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type: "HTML",
          mediaUrl: url,
          mediaMimeType: "text/html",
          storageBytes: size,
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
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById("html-file-input")?.click()}
        className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors py-10 px-4 text-center"
        style={{
          borderColor: dragging ? "var(--foreground)" : "var(--border)",
          background: dragging ? "var(--surface-2)" : "transparent",
        }}
      >
        <input
          id="html-file-input"
          type="file"
          accept=".html,text/html"
          className="hidden"
          onChange={onFileInput}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📄</span>
            <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {(file.size / 1024).toFixed(1)} KB · click to change
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl opacity-30">📄</span>
            <p className="text-sm font-semibold text-[var(--foreground)]">Drop an HTML file here</p>
            <p className="text-xs text-[var(--muted)]">or click to browse · .html only</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My HTML artifact"
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
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={
                tag === t
                  ? { background: TAG_CONFIG[t].bg, color: TAG_CONFIG[t].text, border: "1.5px solid transparent" }
                  : { background: `${TAG_CONFIG[t].bg}18`, color: TAG_CONFIG[t].bg, border: `1.5px solid ${TAG_CONFIG[t].bg}50` }
              }
            >
              {TAG_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {projectSelector}

      <button
        onClick={handleSubmit}
        disabled={submitting || !tag || !file || submitDisabled}
        className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {status ?? "Add HTML artifact"}
      </button>
    </div>
  );
}
