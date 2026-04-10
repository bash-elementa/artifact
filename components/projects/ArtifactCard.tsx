"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, timeAgo } from "@/lib/utils";

interface Artifact {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  isSharedToFeed: boolean;
  isShareable: boolean;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  sourceUrl?: string | null;
  sourceCredit?: string | null;
  createdAt: string;
  reactions?: { emoji: string }[];
}

interface ArtifactCardProps {
  artifact: Artifact;
  onClick: () => void;
  onShareToggle?: (id: string, shared: boolean) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string, description: string | null) => void;
}

function RenameModal({
  artifact,
  onClose,
  onSave,
}: {
  artifact: Artifact;
  onClose: () => void;
  onSave: (name: string, description: string | null) => Promise<void>;
}) {
  const [name, setName] = useState(artifact.name);
  const [description, setDescription] = useState(artifact.description ?? "");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim() || null);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm glass rounded-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[var(--foreground)]">Rename artifact</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Description <span className="opacity-50">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--muted)] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function looksLikeVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.includes("videodelivery.net") ||
    lower.includes("cloudflarestream.com") ||
    lower.endsWith(".m3u8") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

function isCFStream(url: string): boolean {
  return url.includes("videodelivery.net") || url.includes("cloudflarestream.com");
}

function cfEmbedUrl(url: string): string {
  const base = url.match(/^(https?:\/\/[^/]+\/[^/]+)/)?.[1] ?? url;
  const uid = base.split("/").pop()!;
  return `https://iframe.videodelivery.net/${uid}?autoplay=true&muted=true&loop=true&controls=false&preload=auto`;
}

function getPreviewUrl(artifact: Artifact): string | null {
  if (artifact.type === "MEDIA" && artifact.mediaUrl) return artifact.mediaUrl;
  if (artifact.type === "FIGMA" && artifact.figmaPreviewUrl) return artifact.figmaPreviewUrl;
  if (artifact.type === "URL" && artifact.screenshotUrl) return artifact.screenshotUrl;
  return null;
}

export function ArtifactCard({ artifact, onClick, onShareToggle, onDelete, onRename }: ArtifactCardProps) {
  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(artifact.isSharedToFeed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [displayName, setDisplayName] = useState(artifact.name);

  const previewUrl = getPreviewUrl(artifact);
  const isVideo =
    artifact.mediaMimeType?.startsWith("video/") ||
    (!!artifact.mediaUrl && looksLikeVideo(artifact.mediaUrl));

  async function toggleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!artifact.isShareable) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/artifacts/${artifact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSharedToFeed: !isShared }),
      });
      if (res.ok) {
        setIsShared(!isShared);
        onShareToggle?.(artifact.id, !isShared);
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm("Delete this artifact?")) return;
    await fetch(`/api/artifacts/${artifact.id}`, { method: "DELETE" });
    onDelete?.(artifact.id);
  }

  async function handleSaveRename(name: string, description: string | null) {
    const res = await fetch(`/api/artifacts/${artifact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      setDisplayName(name);
      onRename?.(artifact.id, name, description);
    }
    setRenameOpen(false);
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      {/* Image area — no fixed aspect, let content breathe */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--surface-2)] min-h-[120px]">
        {previewUrl ? (
          isVideo ? (
            isCFStream(previewUrl) ? (
              <iframe
                src={cfEmbedUrl(previewUrl)}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                className="w-full aspect-video pointer-events-none"
                style={{ border: "none" }}
              />
            ) : (
              <video
                src={previewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full object-cover"
              />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={artifact.name}
              className="w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          )
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center">
            <span className="text-4xl opacity-20">
              {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
            </span>
          </div>
        )}

        {/* Hover overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-2xl" />

        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {artifact.isShareable && (
            <button
              onClick={toggleShare}
              disabled={sharing}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                isShared
                  ? "bg-[var(--accent)] text-[var(--background)]"
                  : "bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              )}
            >
              {isShared ? "Shared" : "Share"}
            </button>
          )}

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-white text-xs hover:bg-black/80"
            >
              ···
            </button>
            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenameOpen(true); }}
                  className="w-full px-3 py-2.5 text-left text-xs text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                >
                  Rename
                </button>
                <div className="h-px bg-[var(--border)] mx-2" />
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2.5 text-left text-xs text-red-400 hover:bg-[var(--surface-2)]"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </motion.div>

    <AnimatePresence>
      {renameOpen && (
        <RenameModal
          artifact={{ ...artifact, name: displayName }}
          onClose={() => setRenameOpen(false)}
          onSave={handleSaveRename}
        />
      )}
    </AnimatePresence>
    </>
  );
}
