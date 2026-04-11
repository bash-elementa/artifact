"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, X as PhX } from "@phosphor-icons/react";

interface UserOption {
  id: string;
  name: string | null;
  image: string | null;
  role: string | null;
  team: string | null;
}

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: { id: string; name: string }) => void;
  currentUserId?: string;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ContributorPicker({
  users,
  selectedIds,
  onToggle,
}: {
  users: UserOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = users.filter((u) =>
    (u.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (u.team ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const selected = users.filter((u) => selectedIds.has(u.id));

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs text-[var(--muted)] font-medium">Add contributors <span className="opacity-50">(optional)</span></label>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div
                className="rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden"
                style={{ width: 16, height: 16, fontSize: 8, fontWeight: 600 }}
              >
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials(u.name)}</span>
                )}
              </div>
              <span className="text-[var(--foreground)]">{u.name ?? "Unknown"}</span>
              <button type="button" onClick={() => onToggle(u.id)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <PhX size={10} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-left transition-colors focus:outline-none focus:border-[var(--muted)]"
          style={{ color: selectedIds.size > 0 ? "var(--foreground)" : "var(--muted)" }}
        >
          <span>
            {users.length === 0
              ? "No other users found"
              : selectedIds.size > 0
              ? `${selectedIds.size} contributor${selectedIds.size > 1 ? "s" : ""} added`
              : "Search teammates…"}
          </span>
          <CaretDown size={14} className="shrink-0 text-[var(--muted)]" />
        </button>

        <AnimatePresence>
          {open && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl overflow-hidden shadow-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Search input */}
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or team…"
                  className="w-full bg-[var(--surface-2)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none"
                />
              </div>

              {/* Options */}
              <div className="max-h-48 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] px-3 py-2">No matches</p>
                ) : (
                  filtered.map((u) => {
                    const sel = selectedIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { onToggle(u.id); setQuery(""); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-[var(--surface-2)] ${sel ? "bg-[var(--surface-2)]" : ""}`}
                      >
                        <div
                          className="rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ width: 28, height: 28, fontSize: 10, fontWeight: 600 }}
                        >
                          {u.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initials(u.name)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.name ?? "Unknown"}</p>
                          {(u.role || u.team) && (
                            <p className="text-xs text-[var(--muted)] truncate">{[u.role, u.team].filter(Boolean).join(" · ")}</p>
                          )}
                        </div>
                        {sel && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--foreground)] shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function NewProjectModal({ open, onClose, onSuccess, currentUserId }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((res) => res.ok ? res.json() : [])
      .then((data: UserOption[]) => {
        setUsers(data.filter((u) => u.id !== currentUserId));
      })
      .catch(() => {});
  }, [open, currentUserId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSelectedIds(new Set());
      setError(null);
    }
  }, [open]);

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          contributorIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
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

              {/* Contributors section */}
              <ContributorPicker users={users} selectedIds={selectedIds} onToggle={toggleUser} />

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
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-40"
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
