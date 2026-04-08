"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/utils";

interface FileItem {
  file: File;
  preview: string;
  name: string;
  description: string;
  error?: string;
}

interface MediaUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
}

export function MediaUploader({ defaultProjectId, onSuccess }: MediaUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) {
      setError("Some files were rejected. Check type and size limits.");
    }

    const newFiles = accepted.slice(0, 4 - files.length).map((file) => {
      const isVideo = file.type.startsWith("video/");
      const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      return {
        file,
        preview: isVideo ? "" : URL.createObjectURL(file),
        name: file.name.replace(/\.[^.]+$/, ""),
        description: "",
        error: file.size > sizeLimit
          ? `File too large (max ${isVideo ? "500MB" : "50MB"})`
          : undefined,
      };
    });

    setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
  }, [files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/gif": [],
      "image/webp": [],
      "video/mp4": [],
      "video/webm": [],
    },
    maxFiles: 4,
    disabled: files.length >= 4,
  });

  function updateFile(index: number, field: "name" | "description", value: string) {
    setFiles((prev) => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function handleSubmit() {
    const valid = files.filter((f) => !f.error);
    if (valid.length === 0) return;
    if (valid.some((f) => !f.name.trim())) {
      setError("All files need a name.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const item of valid) {
        const isVideo = item.file.type.startsWith("video/");
        const uploadFormData = new FormData();
        uploadFormData.append("file", item.file);

        const uploadRes = await fetch(
          isVideo ? "/api/upload/video" : "/api/upload/media",
          { method: "POST", body: uploadFormData }
        );

        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();

        await fetch("/api/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || undefined,
            type: "MEDIA",
            mediaUrl: isVideo ? uploadData.uid : uploadData.url,
            mediaMimeType: item.file.type,
            storageBytes: item.file.size,
            projectId: defaultProjectId ?? null,
          }),
        });
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {files.length < 4 && (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--border)] hover:border-[var(--muted)]"
          )}
        >
          <input {...getInputProps()} />
          <div className="text-2xl">📁</div>
          <p className="text-sm text-[var(--muted)]">
            {isDragActive ? "Drop files here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            PNG, JPEG, GIF, MP4, WebM · up to 4 files · 50MB images / 500MB video
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          {files.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-[var(--surface-2)] p-3">
              {/* Preview */}
              <div className="w-14 h-14 rounded-lg bg-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🎬</span>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {item.error && (
                  <p className="text-xs text-red-400">{item.error}</p>
                )}
                <input
                  value={item.name}
                  onChange={(e) => updateFile(i, "name", e.target.value)}
                  placeholder="Name *"
                  className="w-full rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
                />
                <input
                  value={item.description}
                  onChange={(e) => updateFile(i, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
                />
              </div>

              <button
                onClick={() => removeFile(i)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={uploading || files.filter((f) => !f.error).length === 0}
        className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {uploading ? "Uploading…" : `Upload ${files.filter((f) => !f.error).length || ""} file${files.filter((f) => !f.error).length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
