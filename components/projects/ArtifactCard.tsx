"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
}

function getPreviewUrl(artifact: Artifact): string | null {
  if (artifact.type === "MEDIA" && artifact.mediaUrl) return artifact.mediaUrl;
  if (artifact.type === "FIGMA" && artifact.figmaPreviewUrl) return artifact.figmaPreviewUrl;
  if (artifact.type === "URL" && artifact.screenshotUrl) return artifact.screenshotUrl;
  return null;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  MEDIA: { label: "Media", className: "bg-blue-500/20 text-blue-300" },
  URL: { label: "URL", className: "bg-purple-500/20 text-purple-300" },
  FIGMA: { label: "Figma", className: "bg-green-500/20 text-green-300" },
  INSPO: { label: "Inspo", className: "bg-yellow-500/20 text-yellow-300" },
};

export function ArtifactCard({ artifact, onClick, onShareToggle, onDelete }: ArtifactCardProps) {
  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(artifact.isSharedToFeed);
  const [menuOpen, setMenuOpen] = useState(false);

  const previewUrl = getPreviewUrl(artifact);
  const badge = TYPE_BADGE[artifact.type] ?? TYPE_BADGE.MEDIA;
  const isVideo = artifact.mediaMimeType?.startsWith("video/");

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--muted)] transition-all duration-200"
      onClick={onClick}
    >
      {/* Preview area */}
      <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
        {previewUrl ? (
          isVideo ? (
            <video
              src={previewUrl}
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={artifact.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30">
              {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : artifact.type === "INSPO" ? "💡" : "🖼️"}
            </span>
          </div>
        )}

        {/* Top-right actions */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Share toggle (not for inspo) */}
          {artifact.isShareable && (
            <button
              onClick={toggleShare}
              disabled={sharing}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                isShared
                  ? "bg-[var(--accent)] text-black"
                  : "bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              )}
            >
              {isShared ? "Shared" : "Share"}
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-white text-xs hover:bg-black/80"
            >
              ···
            </button>
            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-[var(--surface-2)] rounded-xl"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inspo badge */}
        {artifact.type === "INSPO" && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
              inspo
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--foreground)] leading-snug line-clamp-1">
            {artifact.name}
          </p>
          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", badge.className)}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">{timeAgo(artifact.createdAt)}</p>
      </div>
    </motion.div>
  );
}
