"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TAG_CONFIG } from "@/lib/tag-config";

interface CodeUploaderProps {
  defaultProjectId?: string;
  onSuccess: () => void;
  projectSelector?: React.ReactNode;
  submitDisabled?: boolean;
}

const HTML_EXTS = [".html"];
const REACT_EXTS = [".jsx", ".tsx", ".js", ".ts"];

export function CodeUploader({ defaultProjectId, onSuccess, projectSelector, submitDisabled }: CodeUploaderProps) {
  const [mode, setMode] = useState<"html" | "react">("html");
  const toggleNavRef = useRef<HTMLDivElement>(null);
  const [togglePill, setTogglePill] = useState({ left: 0, width: 0, visible: false });
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<"work" | "inspo" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const accepted = mode === "html" ? HTML_EXTS : REACT_EXTS;

  useEffect(() => {
    const nav = toggleNavRef.current;
    if (!nav) return;
    const buttons = nav.querySelectorAll("button");
    const activeIndex = mode === "html" ? 0 : 1;
    const activeBtn = buttons[activeIndex] as HTMLElement | undefined;
    if (!activeBtn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setTogglePill({ left: btnRect.left - navRect.left, width: btnRect.width, visible: true });
  }, [mode]);

  function switchMode(next: "html" | "react") {
    if (next === mode) return;
    setMode(next);
    setFile(null);
    setError(null);
  }

  function acceptFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!accepted.includes(ext)) {
      setError(
        mode === "html"
          ? "Please select a .html file."
          : "Please select a .jsx, .tsx, .js, or .ts file."
      );
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
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
    [mode, name]
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
      setStatus(mode === "html" ? "Uploading HTML file…" : "Uploading component…");
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
        // screenshot is optional
      }

      setStatus("Saving…");
      const saveRes = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type: mode === "html" ? "HTML" : "REACT",
          mediaUrl: url,
          mediaMimeType: mode === "html" ? "text/html" : "text/jsx",
          storageBytes: size,
          screenSize: "DESKTOP",
          screenshotUrl: screenshotUrl ?? null,
          projectId: defaultProjectId ?? null,
          tags: tag ? [tag] : [],
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save artifact");

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
      setStatus(null);
    }
  }

  const inputId = "code-file-input";
  const acceptAttr = mode === "html" ? ".html,text/html" : ".jsx,.tsx,.js,.ts";
  const icon = mode === "html" ? "📄" : "⚛️";
  const dropLabel = mode === "html" ? "Drop an HTML file here" : "Drop a React component here";
  const hint = mode === "html" ? ".html only" : ".jsx .tsx .js .ts";

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
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
        {(["html", "react"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-full",
              mode === m ? "text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {m === "html" ? "HTML" : "React"}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById(inputId)?.click()}
        className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors py-10 px-4 text-center"
        style={{
          borderColor: dragging ? "var(--foreground)" : "var(--border)",
          background: dragging ? "var(--surface-2)" : "transparent",
        }}
      >
        <input
          id={inputId}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={onFileInput}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">{icon}</span>
            <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {(file.size / 1024).toFixed(1)} KB · click to change
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl opacity-30">{icon}</span>
            <p className="text-sm font-semibold text-[var(--foreground)]">{dropLabel}</p>
            <p className="text-xs text-[var(--muted)]">or click to browse · {hint}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--muted)] font-medium">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={mode === "html" ? "My HTML artifact" : "My React component"}
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
        {status ?? `Add ${mode === "html" ? "HTML" : "React"} artifact`}
      </button>
    </div>
  );
}
