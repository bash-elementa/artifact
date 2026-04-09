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

/** Extract Cloudflare Stream UID from an HLS/delivery URL. */
function getCFStreamUID(url: string): string | null {
  const m = url.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i);
  return m ? m[1] : null;
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

/** Best static thumbnail to show in the card for a video artifact. */
function getVideoThumbnail(artifact: Artifact): string | null {
  if (artifact.screenshotUrl) return artifact.screenshotUrl;
  if (artifact.mediaUrl) {
    const url = artifact.mediaUrl;
    if (url.includes("videodelivery.net") || url.includes("cloudflarestream.com")) {
      const base = url.match(/^(https?:\/\/[^/]+\/[^/]+)/)?.[1];
      if (base) return `${base}/thumbnails/thumbnail.jpg`;
    }
  }
  return null;
}

function getPreviewUrl(artifact: Artifact): string | null {
  if (artifact.type === "MEDIA" && artifact.mediaUrl) return artifact.mediaUrl;
  if (artifact.type === "FIGMA" && artifact.figmaPreviewUrl) return artifact.figmaPreviewUrl;
  if (artifact.type === "URL" && artifact.screenshotUrl) return artifact.screenshotUrl;
  return null;
}

export function ArtifactCard({ artifact, onClick, onShareToggle, onDelete }: ArtifactCardProps) {
  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(artifact.isSharedToFeed);
  const [menuOpen, setMenuOpen] = useState(false);

  const previewUrl = getPreviewUrl(artifact);
  const isVideo =
    artifact.mediaMimeType?.startsWith("video/") ||
    (!!artifact.mediaUrl && looksLikeVideo(artifact.mediaUrl));
  const videoThumbnail = isVideo ? getVideoThumbnail(artifact) : null;

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      {/* Image area — no fixed aspect, let content breathe */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--surface-2)]">
        {previewUrl ? (
          isVideo ? (
            videoThumbnail ? (
              // Show thumbnail; full playback happens in the lightbox
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoThumbnail}
                  alt={artifact.name}
                  className="w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white text-sm pl-0.5">▶</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-[var(--surface-2)]">
                <span className="text-4xl opacity-20">🎬</span>
              </div>
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
                  ? "bg-[var(--accent)] text-black"
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
      </div>

      {/* Text below */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-[var(--foreground)] leading-snug line-clamp-1">
          {artifact.name}
        </p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{timeAgo(artifact.createdAt)}</p>
      </div>
    </motion.div>
  );
}
