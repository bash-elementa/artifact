"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { MediaUploader } from "./MediaUploader";
import { UrlUploader } from "./UrlUploader";
import { FigmaUploader } from "./FigmaUploader";
import { HtmlUploader } from "./HtmlUploader";
import { ReactUploader } from "./ReactUploader";
export type UploadType = "media" | "url" | "figma" | "html" | "react";

const TYPE_TITLES: Record<UploadType, string> = {
  media: "Upload media artifact",
  url: "Add website artifact",
  figma: "Add Figma artifact",
  html: "Add HTML artifact",
  react: "Add React artifact",
};

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  type?: UploadType;
  defaultProjectId?: string;
  requireProject?: boolean;
  onSuccess?: () => void;
}

function ProjectSelector({ value, onChange, required }: { value: string | null; onChange: (id: string | null) => void; required?: boolean }) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setProjects(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  const selected = projects.find((p) => p.id === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[var(--muted)] font-medium">Add to project</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-left transition-colors focus:outline-none"
          style={{ color: selected ? "var(--foreground)" : "var(--muted)" }}
        >
          <span>{selected ? selected.name : required ? "Select a project" : "No project"}</span>
          <CaretDown size={14} className="shrink-0 text-[var(--muted)]" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 bottom-full mb-1 z-50 rounded-xl overflow-hidden shadow-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="p-1 max-h-48 overflow-y-auto">
                {!required && (
                  <button
                    type="button"
                    onClick={() => { onChange(null); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${!value ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"}`}
                  >
                    No project
                  </button>
                )}
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(p.id); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${value === p.id ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function UploadModal({ open, onClose, type = "media", defaultProjectId, requireProject, onSuccess }: UploadModalProps) {
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null);

  // Reset when modal opens with a new defaultProjectId
  useEffect(() => {
    if (open) setProjectId(defaultProjectId ?? null);
  }, [open, defaultProjectId]);

  function handleSuccess() {
    onSuccess?.();
    onClose();
  }

  // Show project selector only when not already scoped to a project
  const showProjectSelector = !defaultProjectId;
  const submitDisabled = !!(requireProject && !projectId);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--surface)] shadow-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{TYPE_TITLES[type]}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              {type === "media" && (
                <MediaUploader
                  defaultProjectId={projectId ?? undefined}
                  onSuccess={handleSuccess}
                  submitDisabled={submitDisabled}
                  projectSelector={showProjectSelector ? <ProjectSelector value={projectId} onChange={setProjectId} required={requireProject} /> : undefined}
                />
              )}
              {type === "url" && (
                <UrlUploader
                  defaultProjectId={projectId ?? undefined}
                  onSuccess={handleSuccess}
                  submitDisabled={submitDisabled}
                  projectSelector={showProjectSelector ? <ProjectSelector value={projectId} onChange={setProjectId} required={requireProject} /> : undefined}
                />
              )}
              {type === "figma" && (
                <FigmaUploader
                  defaultProjectId={projectId ?? undefined}
                  onSuccess={handleSuccess}
                  submitDisabled={submitDisabled}
                  projectSelector={showProjectSelector ? <ProjectSelector value={projectId} onChange={setProjectId} required={requireProject} /> : undefined}
                />
              )}
              {type === "html" && (
                <HtmlUploader
                  defaultProjectId={projectId ?? undefined}
                  onSuccess={handleSuccess}
                  submitDisabled={submitDisabled}
                  projectSelector={showProjectSelector ? <ProjectSelector value={projectId} onChange={setProjectId} required={requireProject} /> : undefined}
                />
              )}
              {type === "react" && (
                <ReactUploader
                  defaultProjectId={projectId ?? undefined}
                  onSuccess={handleSuccess}
                  submitDisabled={submitDisabled}
                  projectSelector={showProjectSelector ? <ProjectSelector value={projectId} onChange={setProjectId} required={requireProject} /> : undefined}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
