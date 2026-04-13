"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface HtmlUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

export function HtmlUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: HtmlUploaderProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const toggleNavRef = useRef<HTMLDivElement>(null);
  const [togglePill, setTogglePill] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const nav = toggleNavRef.current;
    if (!nav) return;
    const buttons = nav.querySelectorAll("button");
    const activeBtn = buttons[mode === "upload" ? 0 : 1] as HTMLElement | undefined;
    if (!activeBtn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setTogglePill({ left: btnRect.left - navRect.left, width: btnRect.width, visible: true });
  }, [mode]);

  // Upload mode
  const [file, setFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Paste mode
  const [html, setHtml] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [pasteDescription, setPasteDescription] = useState("");
  const [pasteSubmitting, setPasteSubmitting] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setUploadName(f.name.replace(/\.html?$/, ""));
    setUploadError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/html": [".html", ".htm"] },
    maxFiles: 1,
  });

  async function handleUploadSubmit() {
    if (!file) { setUploadError("Please select an HTML file."); return; }
    if (!uploadName.trim()) { setUploadError("Name is required."); return; }

    setUploading(true);
    setUploadError(null);

    try {
      const htmlContent = await file.text();
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName,
          description: uploadDescription || undefined,
          type: "HTML",
          htmlContent,
          projectId: defaultProjectId ?? null,
        }),
      });
      onSuccess();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setUploading(false);
    }
  }

  async function handlePasteSubmit() {
    if (!html.trim()) { setPasteError("HTML content is required."); return; }
    if (!pasteName.trim()) { setPasteError("Name is required."); return; }

    setPasteSubmitting(true);
    setPasteError(null);

    try {
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pasteName,
          description: pasteDescription || undefined,
          type: "HTML",
          htmlContent: html,
          projectId: defaultProjectId ?? null,
        }),
      });
      onSuccess();
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPasteSubmitting(false);
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
        {(["upload", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-full",
              mode === m ? "text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {m === "upload" ? "Upload file" : "Paste code"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
          {!file ? (
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
              <div className="text-2xl">📄</div>
              <p className="text-sm text-[var(--muted)]">
                {isDragActive ? "Drop your HTML file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-[var(--muted)] opacity-70">.html or .htm</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="text-xl">📄</span>
              <span className="flex-1 text-sm text-[var(--foreground)] truncate font-mono">{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
            <input
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="My report"
              className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Description</label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="What is this?"
              rows={2}
              className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
          {projectSelector}

          <button
            onClick={handleUploadSubmit}
            disabled={uploading || !file || submitDisabled}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {uploading ? "Saving…" : "Add HTML"}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
            <input
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
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
              value={pasteDescription}
              onChange={(e) => setPasteDescription(e.target.value)}
              placeholder="What is this?"
              rows={2}
              className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          {pasteError && <p className="text-sm text-red-400">{pasteError}</p>}
          {projectSelector}

          <button
            onClick={handlePasteSubmit}
            disabled={pasteSubmitting || submitDisabled}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pasteSubmitting ? "Saving…" : "Add HTML"}
          </button>
        </>
      )}
    </div>
  );
}
