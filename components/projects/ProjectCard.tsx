"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DotsThree, UserPlus, Trash, CaretDown, X as PhX } from "@phosphor-icons/react";
import { DropdownCard, DropdownItem } from "@/components/ui/Dropdown";

interface ProjectPreview {
  id: string;
  mediaUrl?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  type: string;
  name: string;
}

interface Contributor {
  id: string;
  name: string | null;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  artifacts: ProjectPreview[];
  _count: { artifacts: number };
  contributors: Contributor[];
  isOwner: boolean;
}

function isVideoUrl(url: string): boolean {
  return (
    url.includes("videodelivery.net") ||
    url.includes("cloudflarestream.com") ||
    /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)
  );
}

function extractYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

function getPreviewUrl(a: ProjectPreview): string | null {
  if (a.screenshotUrl) return a.screenshotUrl;
  if (a.figmaPreviewUrl) return a.figmaPreviewUrl;
  if (a.mediaUrl) return a.mediaUrl;
  if (a.websiteUrl) {
    const ytThumb = extractYouTubeThumbnail(a.websiteUrl);
    if (ytThumb) return ytThumb;
  }
  return null;
}

function TypeIcon({ type }: { type: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
      <span className="text-2xl opacity-20">
        {type === "URL" ? "🌐" : type === "FIGMA" ? "✦" : "🖼️"}
      </span>
    </div>
  );
}

function ThumbImage({ artifact }: { artifact: ProjectPreview }) {
  const url = getPreviewUrl(artifact);
  if (!url) return <TypeIcon type={artifact.type} />;
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={artifact.name} className="w-full h-full object-cover" />
  );
}

function ProjectLayout({ artifacts }: { artifacts: ProjectPreview[] }) {
  const main = artifacts[0] ?? null;
  const mainUrl = main ? getPreviewUrl(main) : null;
  const thumbSlots: (ProjectPreview | null)[] = [
    artifacts[1] ?? null,
    artifacts[2] ?? null,
    artifacts[3] ?? null,
  ];

  return (
    <div className="flex flex-col gap-1.5">
      {/* Hero image */}
      <div className="rounded-xl overflow-hidden aspect-[4/3] bg-[var(--surface-2)]">
        {main ? (
          mainUrl ? (
            isVideoUrl(mainUrl) ? (
              <video src={mainUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainUrl} alt={main.name} className="w-full h-full object-cover" />
            )
          ) : (
            <TypeIcon type={main.type} />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">📁</span>
          </div>
        )}
      </div>

      {/* Thumbnail row — always 3 slots */}
      <div className="grid grid-cols-3 gap-1.5">
        {thumbSlots.map((a, i) => (
          <div key={i} className="rounded-lg overflow-hidden aspect-[4/3] bg-[var(--surface)]">
            {a && <ThumbImage artifact={a} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributorAvatars({ contributors }: { contributors: Contributor[] }) {
  if (contributors.length === 0) return null;

  const MAX_SHOWN = 4;
  const shown = contributors.slice(0, MAX_SHOWN);
  const overflow = contributors.length - MAX_SHOWN;

  function initials(name: string | null): string {
    if (!name) return "?";
    return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex items-center">
      {shown.map((c, i) => (
        <div
          key={c.id}
          title={c.name ?? undefined}
          className="rounded-full border-2 border-[var(--background)] bg-[var(--surface-2)] text-[var(--foreground)] flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: 20, height: 20, fontSize: 8, fontWeight: 600, zIndex: shown.length - i, marginLeft: i === 0 ? 0 : -5 }}
        >
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt={c.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <span>{initials(c.name)}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full border-2 border-[var(--background)] bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center shrink-0"
          style={{ width: 20, height: 20, fontSize: 8, fontWeight: 600, marginLeft: -5 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface UserOption {
  id: string;
  name: string | null;
  image: string | null;
  role: string | null;
  team: string | null;
}

// ── ManageModal ──────────────────────────────────────────────────────────────

function ContributorPickerInline({
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
        setOpen(false); setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function avatarInitials(name: string | null) {
    if (!name) return "?";
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <div key={u.id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden"
                style={{ width: 16, height: 16, fontSize: 8, fontWeight: 600 }}>
                {u.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                  : <span>{avatarInitials(u.name)}</span>}
              </div>
              <span className="text-[var(--foreground)]">{u.name ?? "Unknown"}</span>
              <button type="button" onClick={() => onToggle(u.id)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <PhX size={10} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <button type="button" onClick={() => { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-full flex items-center justify-between rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-left"
          style={{ color: selectedIds.size > 0 ? "var(--foreground)" : "var(--muted)" }}>
          <span>{users.length === 0 ? "No other users" : selectedIds.size > 0 ? `${selectedIds.size} contributor${selectedIds.size > 1 ? "s" : ""} added` : "Search teammates…"}</span>
          <CaretDown size={14} className="shrink-0 text-[var(--muted)]" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 z-50 rounded-xl shadow-xl overflow-hidden"
              style={{ top: "calc(100% + 4px)", background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="p-2">
                <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…" className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:outline-none text-[var(--foreground)] placeholder-[var(--muted)]" />
              </div>
              <div className="max-h-48 overflow-y-auto pb-2">
                {filtered.length === 0
                  ? <p className="px-4 py-3 text-sm text-[var(--muted)]">No results</p>
                  : filtered.map((u) => (
                    <button key={u.id} type="button" onClick={() => onToggle(u.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left">
                      <div className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ width: 28, height: 28, fontSize: 10, fontWeight: 600 }}>
                        {u.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                          : <span className="text-[var(--foreground)]">{avatarInitials(u.name)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.name ?? "Unknown"}</p>
                        {u.team && <p className="text-xs text-[var(--muted)] truncate">{u.team}</p>}
                      </div>
                      {selectedIds.has(u.id) && <span className="text-xs text-[var(--accent)] font-semibold">✓</span>}
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

function ManageModal({
  project,
  onClose,
  onUpdated,
}: {
  project: Project;
  onClose: () => void;
  onUpdated: (contributors: Contributor[]) => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(project.contributors.map((c) => c.id))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data) => {
      setUsers(Array.isArray(data) ? data.filter((u: UserOption) => !project.contributors.find(c => c.id === u.id) || selectedIds.has(u.id)) : []);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributorIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const allUsers = await fetch("/api/users").then(r => r.json());
      const updated: Contributor[] = (Array.isArray(allUsers) ? allUsers : [])
        .filter((u: UserOption) => selectedIds.has(u.id))
        .map((u: UserOption) => ({ id: u.id, name: u.name, image: u.image }));
      onUpdated(updated);
      onClose();
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Manage contributors</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">{project.name}</p>
        </div>

        <ContributorPickerInline users={users} selectedIds={selectedIds} onToggle={toggleUser} />

        {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--foreground)", color: "var(--background)" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── ProjectCard ──────────────────────────────────────────────────────────────

export function ProjectCard({ project, onDelete }: { project: Project; onDelete?: (id: string) => void }) {
  const count = project._count.artifacts;
  const [menuOpen, setMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>(project.contributors);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  function handleDelete() {
    setMenuOpen(false);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleteOpen(false);
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onDelete?.(project.id);
  }

  return (
    <div className={`group relative${deleting ? " opacity-50 pointer-events-none" : ""}`}>
      <Link href={`/projects/${project.id}`} className="block">
        {/* Dribbble-style layout */}
        <div className="relative transition-opacity duration-200 group-hover:opacity-90">
          <ProjectLayout artifacts={project.artifacts} />
        </div>

        {/* Text */}
        <div className="mt-2.5 px-0.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] leading-snug truncate">{project.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {count} {count === 1 ? "artifact" : "artifacts"}
              {contributors.length > 0 ? ` · ${contributors.length + 1} members` : ""}
            </p>
          </div>
          <ContributorAvatars contributors={contributors} />
        </div>
      </Link>

      {/* ··· menu — owner only */}
      {project.isOwner && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
            className="rounded-full bg-black/60 backdrop-blur-sm p-1.5 text-white hover:bg-black/80 flex items-center justify-center"
          >
            <DotsThree size={16} weight="bold" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <DropdownCard className="right-0 w-44">
                <div className="p-1.5" onClick={(e) => e.preventDefault()}>
                  <DropdownItem
                    icon={<UserPlus size={16} />}
                    label="Manage"
                    onClick={() => { setMenuOpen(false); setManageOpen(true); }}
                  />
                  <DropdownItem
                    icon={<Trash size={16} />}
                    label="Delete project"
                    danger
                    onClick={handleDelete}
                  />
                </div>
              </DropdownCard>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {manageOpen && (
          <ManageModal
            project={{ ...project, contributors }}
            onClose={() => setManageOpen(false)}
            onUpdated={(updated) => setContributors(updated)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm glass rounded-2xl p-6 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-semibold text-[var(--foreground)]">Delete project</h2>
                <p className="text-sm text-[var(--muted)]">
                  <span className="text-[var(--foreground)] font-medium">&ldquo;{project.name}&rdquo;</span> and all its artifacts will be permanently deleted. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--error)", color: "var(--error-fg)" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
