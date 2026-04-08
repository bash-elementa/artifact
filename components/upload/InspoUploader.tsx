"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn, MAX_IMAGE_SIZE } from "@/lib/utils";

interface InspoUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
}

export function InspoUploader({ defaultProjectId, onSuccess }: InspoUploaderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceCredit, setSourceCredit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (f.size > MAX_IMAGE_SIZE) {
      setError("Image exceeds 50MB limit.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/gif": [], "image/webp": [] },
    maxFiles: 1,
    disabled: !!file,
  });

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!file && !sourceUrl.trim()) {
      setError("Provide either an image or a source URL.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let mediaUrl: string | undefined;
      let mediaMimeType: string | undefined;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/media", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        mediaUrl = data.url;
        mediaMimeType = file.type;
      }

      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          type: "INSPO",
          mediaUrl,
          mediaMimeType,
          sourceUrl: sourceUrl || undefined,
          sourceCredit: sourceCredit || undefined,
          projectId: defaultProjectId ?? null,
          // isShareable will be false server-side for INSPO
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
      {/* Inspo notice */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <p className="text-xs text-[var(--muted)]">
          💡 <strong className="text-[var(--foreground)]">Inspo</strong> is for third-party reference material. It lives only in your Projects tab and can never be shared to the Explore feed.
        </p>
      </div>

      {/* Image upload */}
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--border)] hover:border-[var(--muted)]"
          )}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-[var(--muted)]">Drop an image here (optional)</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-[var(--surface-2)] h-32">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          )}
          <button
            onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-2 right-2 rounded-full bg-black/60 w-6 h-6 flex items-center justify-center text-white text-sm hover:bg-black/80"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Source URL</label>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://dribbble.com/…"
          type="url"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What is this?"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Credit / attribution</label>
        <input
          value={sourceCredit}
          onChange={(e) => setSourceCredit(e.target.value)}
          placeholder="e.g. @designer on Dribbble"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why is this inspiring?"
          rows={2}
          className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--muted)] disabled:opacity-40"
      >
        {submitting ? "Saving…" : "Save to Projects only"}
      </button>
    </div>
  );
}
