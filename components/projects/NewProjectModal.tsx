"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: { id: string; name: string }) => void;
}

export function NewProjectModal({ open, onClose, onSuccess }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      setName("");
      setDescription("");
      onSuccess(project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-semibold">New project</h2>
              <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--muted)] font-medium">Project name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Brand Refresh 2026"
                  autoFocus
                  maxLength={80}
                  className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--muted)] font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={2}
                  maxLength={300}
                  className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:outline-none focus:border-[var(--muted)]"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || submitting}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {submitting ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
