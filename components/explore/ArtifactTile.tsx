"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 5;
const EMOJIS = ["❤️", "🔥", "🤯"];

interface FeedArtifact {
  id: string;
  name: string;
  type: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  reactionCounts: Record<string, number>;
  myReactions: string[];
  user: { id: string; name: string; role?: string | null; team?: string | null; image?: string | null };
}

interface ArtifactTileProps {
  artifact: FeedArtifact;
  style: React.CSSProperties;
  onClick: () => void;
  onReact?: (emoji: string, action: "added" | "removed") => void;
}

function getPreviewUrl(artifact: FeedArtifact): string | null {
  if (artifact.type === "MEDIA" && artifact.mediaUrl) return artifact.mediaUrl;
  if (artifact.type === "FIGMA" && artifact.figmaPreviewUrl) return artifact.figmaPreviewUrl;
  if (artifact.type === "URL" && artifact.screenshotUrl) return artifact.screenshotUrl;
  return null;
}

function getCFStreamUID(url: string): string | null {
  const m = url.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i);
  return m ? m[1] : null;
}

function getVideoThumbnail(artifact: FeedArtifact): string | null {
  if (artifact.screenshotUrl) return artifact.screenshotUrl;
  if (artifact.mediaUrl) {
    const uid = getCFStreamUID(artifact.mediaUrl);
    if (uid) return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
  }
  return null;
}

const TILE_SIZES = [
  { width: 240, height: 180 },
  { width: 280, height: 210 },
  { width: 220, height: 280 },
  { width: 300, height: 200 },
  { width: 260, height: 195 },
];

export function ArtifactTile({ artifact, style, onClick, onReact }: ArtifactTileProps) {
  const previewUrl = getPreviewUrl(artifact);
  const isVideo = artifact.mediaMimeType?.startsWith("video/");
  const videoThumbnail = isVideo ? getVideoThumbnail(artifact) : null;
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const [counts, setCounts] = useState<Record<string, number>>(artifact.reactionCounts);
  const [mine, setMine] = useState<Set<string>>(new Set(artifact.myReactions));
  const [loading, setLoading] = useState<string | null>(null);

  async function handleReact(e: React.MouseEvent, emoji: string) {
    e.stopPropagation();
    if (loading) return;
    setLoading(emoji);

    const wasReacted = mine.has(emoji);
    const newMine = new Set(mine);
    const newCounts = { ...counts };

    if (wasReacted) {
      newMine.delete(emoji);
      newCounts[emoji] = Math.max(0, (newCounts[emoji] ?? 0) - 1);
      if (newCounts[emoji] === 0) delete newCounts[emoji];
    } else {
      newMine.add(emoji);
      newCounts[emoji] = (newCounts[emoji] ?? 0) + 1;
    }

    setMine(newMine);
    setCounts(newCounts);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId: artifact.id, emoji }),
      });
      if (!res.ok) {
        setMine(mine);
        setCounts(counts);
      } else {
        const data = await res.json();
        onReact?.(emoji, data.action as "added" | "removed");
      }
    } catch {
      setMine(mine);
      setCounts(counts);
    } finally {
      setLoading(null);
    }
  }

  const initials = artifact.user.name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute group cursor-pointer rounded-3xl overflow-hidden"
      style={{
        ...style,
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
      onMouseDown={(e) => {
        pointerDown.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (!pointerDown.current) return;
        const dx = e.clientX - pointerDown.current.x;
        const dy = e.clientY - pointerDown.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
        onClick();
      }}
    >
      {/* Preview */}
      <div className="relative w-full h-full">
        {previewUrl ? (
          isVideo ? (
            videoThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={videoThumbnail}
                alt={artifact.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
                <span className="text-4xl opacity-30">🎬</span>
              </div>
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
            <span className="text-4xl opacity-30">
              {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
            </span>
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Hover UI */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          {/* Single row: user pill + reactions */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* User pill — shrinks and truncates for long names */}
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5 min-w-0 flex-1 overflow-hidden">
              {artifact.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artifact.user.image}
                  alt={artifact.user.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">{initials}</span>
                </div>
              )}
              <span className="text-xs font-medium text-white truncate">{artifact.user.name}</span>
            </div>

            {/* Reaction buttons — fixed width, never shrink */}
            {EMOJIS.map((emoji) => {
              const count = counts[emoji] ?? 0;
              const active = mine.has(emoji);
              return (
                <button
                  key={emoji}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleReact(e, emoji)}
                  disabled={loading === emoji}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 backdrop-blur-sm shrink-0",
                    active
                      ? "bg-white/30 text-white scale-105"
                      : "bg-black/50 text-white/80 hover:bg-black/70"
                  )}
                >
                  <span className="tabular-nums">{count}</span>
                  <span className="leading-none">{emoji}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Export tile size computation so canvas can use it
export function getTileSize(index: number): { width: number; height: number } {
  return TILE_SIZES[index % TILE_SIZES.length];
}
