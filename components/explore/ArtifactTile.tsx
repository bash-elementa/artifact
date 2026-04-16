"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TAG_CONFIG } from "@/lib/tag-config";

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
  tags?: string[];
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
  if (artifact.type === "MEDIA") {
    const isVideo =
      artifact.mediaMimeType?.startsWith("video/") ||
      (!!artifact.mediaUrl && looksLikeVideo(artifact.mediaUrl));
    // Uploaded videos: show static thumbnail (playback is in the lightbox).
    // For CF Stream fall back to their CDN thumbnail when screenshotUrl is absent.
    if (isVideo) {
      if (artifact.screenshotUrl) return artifact.screenshotUrl;
      const uid = (artifact.mediaUrl ?? "").match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i)?.[1];
      if (uid) return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
      return null;
    }
    // Images: the mediaUrl is the image itself
    return artifact.mediaUrl ?? null;
  }
  if (artifact.type === "FIGMA") return artifact.figmaPreviewUrl ?? null;
  if (artifact.type === "URL") {
    // The URL uploader stores the pasted URL in websiteUrl (not mediaUrl).
    // If it looks like a video (direct .mp4 link etc.), use it as the video src.
    const videoSrc = artifact.mediaUrl ?? artifact.websiteUrl ?? null;
    const hasVideo =
      artifact.mediaMimeType?.startsWith("video/") ||
      (!!videoSrc && looksLikeVideo(videoSrc));
    if (hasVideo && videoSrc) return videoSrc;
    return artifact.screenshotUrl ?? null;
  }
  if (artifact.type === "HTML" || artifact.type === "REACT") return artifact.screenshotUrl ?? null;
  return null;
}

function looksLikeVideo(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("videodelivery.net") || lower.includes("cloudflarestream.com")) return true;
  // Match extension before any query/hash/trailing slash
  return /\.(mp4|webm|mov|m3u8)([?#/]|$)/.test(lower);
}

function isCFStream(url: string): boolean {
  return url.includes("videodelivery.net") || url.includes("cloudflarestream.com");
}

/** Return an iframe-embeddable URL for Cloudflare Stream videos. */
function cfEmbedUrl(url: string): string {
  // Extract base (scheme + host + first path segment = UID) then build iframe URL
  const base = url.match(/^(https?:\/\/[^/]+\/[^/]+)/)?.[1] ?? url;
  const uid = base.split("/").pop()!;
  return `https://iframe.videodelivery.net/${uid}?autoplay=true&muted=true&loop=true&controls=false&preload=auto`;
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
  // Derive isVideo from previewUrl so the render path always matches the src
  const isVideo = !!previewUrl && looksLikeVideo(previewUrl);
  const [imgFailed, setImgFailed] = useState(false);
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
        {previewUrl && !imgFailed ? (
          isVideo ? (
            isCFStream(previewUrl) ? (
              <iframe
                src={cfEmbedUrl(previewUrl)}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                className="w-full h-full pointer-events-none"
                style={{ border: "none" }}
              />
            ) : (
              <video
                src={previewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={artifact.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
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

        {/* Tag chip — top-left, visible on hover */}
        {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
          <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none"
              style={{
                background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                color: "#fff",
              }}
            >
              {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
            </span>
          </div>
        )}

        {/* Hover UI */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          {/* Single row: user pill + reactions */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* User pill — links to profile, shrinks and truncates for long names */}
            <Link
              href={`/users/${artifact.user.id}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5 min-w-0 flex-1 overflow-hidden hover:bg-black/70 transition-colors"
            >
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
            </Link>

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
