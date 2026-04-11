"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

function inferMimeType(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".mp4")) return "video/mp4";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".m3u8")) return "video/mp4"; // HLS stream
  if (url.includes("videodelivery.net") || url.includes("cloudflarestream.com")) return "video/mp4";
  if (url.includes("giphy.com") || url.includes("tenor.com")) return "image/gif";
  return "image/jpeg"; // default assumption
}

function isVideoMime(mime: string) {
  return mime.startsWith("video/");
}

export function MediaUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: MediaUploaderProps) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const toggleNavRef = useRef<HTMLDivElement>(null);
  const [togglePill, setTogglePill] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const nav = toggleNavRef.current;
    if (!nav) return;
    const buttons = nav.querySelectorAll("button");
    const activeIndex = mode === "upload" ? 0 : 1;
    const activeBtn = buttons[activeIndex] as HTMLElement | undefined;
    if (!activeBtn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setTogglePill({ left: btnRect.left - navRect.left, width: btnRect.width, visible: true });
  }, [mode]);

  // Upload mode state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Link mode state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) setUploadError("Some files were rejected. Check type and size limits.");
    const newFiles = accepted.slice(0, 4 - files.length).map((file) => {
      const isVideo = file.type.startsWith("video/");
      const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      return {
        file,
        preview: isVideo ? "" : URL.createObjectURL(file),
        name: file.name.replace(/\.[^.]+$/, ""),
        description: "",
        error: file.size > sizeLimit ? `File too large (max ${isVideo ? "500MB" : "50MB"})` : undefined,
      };
    });
    setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
  }, [files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [], "image/jpeg": [], "image/gif": [], "image/webp": [],
      "video/mp4": [], "video/webm": [],
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

  async function handleUploadSubmit() {
    const valid = files.filter((f) => !f.error);
    if (valid.length === 0) return;
    if (valid.some((f) => !f.name.trim())) { setUploadError("All files need a name."); return; }

    setUploading(true);
    setUploadError(null);

    try {
      for (const item of valid) {
        const isVideo = item.file.type.startsWith("video/");
        const uploadFormData = new FormData();
        uploadFormData.append("file", item.file);

        const uploadRes = await fetch(isVideo ? "/api/upload/video" : "/api/upload/media", {
          method: "POST", body: uploadFormData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();

        await fetch("/api/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || undefined,
            type: "MEDIA",
            mediaUrl: isVideo ? uploadData.playbackUrl : uploadData.url,
            mediaMimeType: item.file.type,
            screenshotUrl: isVideo ? (uploadData.thumbnailUrl ?? null) : null,
            storageBytes: item.file.size,
            projectId: defaultProjectId ?? null,
          }),
        });
      }
      onSuccess();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleLinkSubmit() {
    if (!linkUrl.trim() || !linkName.trim()) { setLinkError("URL and name are required."); return; }

    let validUrl: string;
    try { validUrl = new URL(linkUrl).toString(); }
    catch { setLinkError("Please enter a valid URL."); return; }

    setLinkSubmitting(true);
    setLinkError(null);

    try {
      const mimeType = inferMimeType(validUrl);
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: linkName,
          description: linkDescription || undefined,
          type: "MEDIA",
          mediaUrl: validUrl,
          mediaMimeType: mimeType,
          storageBytes: 0,
          projectId: defaultProjectId ?? null,
        }),
      });
      onSuccess();
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLinkSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div
        ref={toggleNavRef}
        className="relative flex items-center rounded-full p-1.5 gap-1 self-center"
        style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
      >
        <motion.span
          className="absolute rounded-full shadow-sm pointer-events-none"
          style={{ background: "var(--foreground)", top: 6, bottom: 6 }}
          animate={{ left: togglePill.left, width: togglePill.width, opacity: togglePill.visible ? 1 : 0 }}
          initial={{ left: togglePill.left, width: togglePill.width, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
        {(["upload", "link"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-full",
              mode === m ? "text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {m === "upload" ? "Upload file" : "Paste link"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
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
                PNG, JPEG, GIF, WebP, MP4, WebM · up to 4 files · 50MB images / 500MB video
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-col gap-3">
              {files.map((item, i) => (
                <div key={i} className="flex gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                  <div className="w-14 h-14 rounded-lg bg-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🎬</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {item.error && <p className="text-xs text-red-400">{item.error}</p>}
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
                  <button onClick={() => removeFile(i)} className="text-[var(--muted)] hover:text-[var(--foreground)] shrink-0 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}

          {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}

          {projectSelector}

          <button
            onClick={handleUploadSubmit}
            disabled={uploading || files.filter((f) => !f.error).length === 0 || submitDisabled}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {uploading ? "Uploading…" : `Upload ${files.filter((f) => !f.error).length || ""} file${files.filter((f) => !f.error).length !== 1 ? "s" : ""}`}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Media URL *</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
              className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
            <p className="text-xs text-[var(--muted)]">Images, GIFs, videos — direct file links or Giphy/Tenor URLs</p>
          </div>

          {linkUrl && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center" style={{ minHeight: 120 }}>
              {isVideoMime(inferMimeType(linkUrl)) ? (
                <video src={linkUrl} className="max-h-40 max-w-full rounded" controls muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={linkUrl} alt="Preview" className="max-h-40 max-w-full object-contain rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="My media"
              className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Description</label>
            <input
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          {linkError && <p className="text-sm text-red-400">{linkError}</p>}

          {projectSelector}

          <button
            onClick={handleLinkSubmit}
            disabled={linkSubmitting || !linkUrl.trim() || !linkName.trim() || submitDisabled}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {linkSubmitting ? "Saving…" : "Save media"}
          </button>
        </>
      )}
    </div>
  );
}
