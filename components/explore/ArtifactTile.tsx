"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 5;

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
}

function getPreviewUrl(artifact: FeedArtifact): string | null {
  if (artifact.type === "MEDIA" && artifact.mediaUrl) return artifact.mediaUrl;
  if (artifact.type === "FIGMA" && artifact.figmaPreviewUrl) return artifact.figmaPreviewUrl;
  if (artifact.type === "URL" && artifact.screenshotUrl) return artifact.screenshotUrl;
  return null;
}

const TILE_SIZES = [
  { width: 240, height: 180 },
  { width: 280, height: 210 },
  { width: 220, height: 280 },
  { width: 300, height: 200 },
  { width: 260, height: 195 },
];

export function ArtifactTile({ artifact, style, onClick }: ArtifactTileProps) {
  const previewUrl = getPreviewUrl(artifact);
  const isVideo = artifact.mediaMimeType?.startsWith("video/");
  const totalReactions = Object.values(artifact.reactionCounts).reduce((a, b) => a + b, 0);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "absolute group cursor-pointer rounded-3xl overflow-hidden",
        "transition-[filter] duration-200 hover:brightness-[1.08]",
      )}
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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-xs font-semibold text-white leading-snug line-clamp-1">{artifact.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-white/70">{artifact.user.name}</p>
            {totalReactions > 0 && (
              <p className="text-[10px] text-white/70">{totalReactions} reaction{totalReactions !== 1 ? "s" : ""}</p>
            )}
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
