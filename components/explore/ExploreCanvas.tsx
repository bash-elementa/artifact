"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { SquaresFour, Compass } from "@phosphor-icons/react";
import { ArtifactTile } from "./ArtifactTile";
import { ArtifactLightbox } from "./ArtifactLightbox";
import { LoadingDots } from "@/components/ui/LoadingDots";

interface FeedArtifact {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  screenSize?: string | null;
  isSharedToFeed: boolean;
  createdAt: string;
  reactionCounts: Record<string, number>;
  myReactions: string[];
  user: {
    id: string;
    name: string;
    role?: string | null;
    team?: string | null;
    image?: string | null;
  };
}

const VIEWPORT_BUFFER = 400;
const COLUMN_COUNT = 5;
const COLUMN_WIDTH = 280;
const COLUMN_GAP = 16;
const ITEM_GAP = 16;
const PADDING = 24;
const FALLBACK_HEIGHTS = [220, 300, 240, 280, 200, 260, 320, 180, 250, 210];

type Dims = Record<string, { w: number; h: number }>;
type LayoutItem = { artifact: FeedArtifact; x: number; y: number; width: number; height: number };
type Layout = { items: LayoutItem[]; canvasWidth: number; canvasHeight: number };

// Fast seeded RNG (mulberry32)
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function previewUrl(a: FeedArtifact): string | null {
  return a.mediaUrl ?? a.figmaPreviewUrl ?? a.screenshotUrl ?? null;
}

function layoutArtifacts(artifacts: FeedArtifact[], dims: Dims, seed: number): Layout {
  if (artifacts.length === 0) return { items: [], canvasWidth: 1200, canvasHeight: 600 };

  const rng = makeRng(seed);

  // Shuffle so new artifacts don't always append to the same column
  const shuffled = [...artifacts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const columnHeights = Array(COLUMN_COUNT).fill(PADDING);
  const items: LayoutItem[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const a = shuffled[i];
    const col = columnHeights.indexOf(Math.min(...columnHeights));
    const x = PADDING + col * (COLUMN_WIDTH + COLUMN_GAP);
    const y = columnHeights[col];

    const d = dims[a.id];
    const raw = d ? Math.round(COLUMN_WIDTH * d.h / d.w) : FALLBACK_HEIGHTS[i % FALLBACK_HEIGHTS.length];
    const height = Math.max(160, Math.min(480, raw));

    items.push({ artifact: a, x, y, width: COLUMN_WIDTH, height });
    columnHeights[col] += height + ITEM_GAP;
  }

  const canvasWidth = PADDING * 2 + COLUMN_COUNT * COLUMN_WIDTH + (COLUMN_COUNT - 1) * COLUMN_GAP;
  const canvasHeight = Math.max(...columnHeights) + PADDING;

  return { items, canvasWidth, canvasHeight };
}

async function loadDimensions(artifacts: FeedArtifact[]): Promise<Dims> {
  const results = await Promise.all(
    artifacts.map((a) => {
      const url = previewUrl(a);
      if (!url) return Promise.resolve({ id: a.id, w: 4, h: 3 });
      return new Promise<{ id: string; w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ id: a.id, w: img.naturalWidth || 4, h: img.naturalHeight || 3 });
        img.onerror = () => resolve({ id: a.id, w: 4, h: 3 });
        img.src = url;
      });
    })
  );
  const dims: Dims = {};
  for (const r of results) dims[r.id] = { w: r.w, h: r.h };
  return dims;
}

function VirtualizedTiles({ layout, onTileClick, onReact }: { layout: Layout; onTileClick: (a: FeedArtifact) => void; onReact: (artifactId: string, emoji: string, action: "added" | "removed") => void }) {
  const [viewport, setViewport] = useState({
    x: 0, y: 0,
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useTransformEffect(({ state }) => {
    const { positionX, positionY, scale } = state;
    setViewport({
      x: -positionX / scale,
      y: -positionY / scale,
      w: (typeof window !== "undefined" ? window.innerWidth : 1440) / scale,
      h: (typeof window !== "undefined" ? window.innerHeight : 900) / scale,
    });
  });

  const visible = useMemo(
    () =>
      layout.items.filter(
        ({ x, y, width, height }) =>
          x + width > viewport.x - VIEWPORT_BUFFER &&
          x < viewport.x + viewport.w + VIEWPORT_BUFFER &&
          y + height > viewport.y - VIEWPORT_BUFFER &&
          y < viewport.y + viewport.h + VIEWPORT_BUFFER
      ),
    [layout, viewport]
  );

  return (
    <>
      {visible.map(({ artifact, x, y, width, height }) => (
        <ArtifactTile
          key={artifact.id}
          artifact={artifact}
          style={{ left: x, top: y, width, height }}
          onClick={() => onTileClick(artifact)}
          onReact={(emoji, action) => onReact(artifact.id, emoji, action)}
        />
      ))}
    </>
  );
}

// ── Grid column slider ───────────────────────────────────────────────────────
const GRID_STEPS = 5; // 2–6 columns
const GRID_STEP_PX = 20;
const GRID_TRACK_W = (GRID_STEPS - 1) * GRID_STEP_PX; // 80px
const GRID_THUMB = 22;
const GRID_SPRING = { type: "spring" as const, stiffness: 70, damping: 5, mass: 1.6 };

function GridColumnSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const x = useMotionValue((value - 2) * GRID_STEP_PX);
  const displayValue = useTransform(x, (v) => Math.round(Math.max(0, Math.min(GRID_TRACK_W, v)) / GRID_STEP_PX) + 2);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isDragging.current) return;
    animate(x, (value - 2) * GRID_STEP_PX, GRID_SPRING);
  }, [value, x]);

  return (
    <div className="flex items-center" style={{ width: GRID_TRACK_W + GRID_THUMB, height: GRID_THUMB }}>
      <div className="relative flex items-center w-full h-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: GRID_THUMB / 2, width: GRID_TRACK_W, height: 2, background: "var(--border)" }}
        />
        {Array.from({ length: GRID_STEPS }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{ left: i * GRID_STEP_PX + GRID_THUMB / 2 - 3, width: 6, height: 6, background: "var(--muted)", opacity: 0.4 }}
          />
        ))}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: GRID_TRACK_W }}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x, left: 0, width: GRID_THUMB, height: GRID_THUMB, background: "var(--foreground-solid)" }}
          onDragStart={() => { isDragging.current = true; }}
          onDrag={() => {
            const raw = Math.max(0, Math.min(GRID_TRACK_W, x.get()));
            onChange(Math.round(raw / GRID_STEP_PX) + 2);
          }}
          onDragEnd={() => {
            const step = Math.round(Math.max(0, Math.min(GRID_TRACK_W, x.get())) / GRID_STEP_PX);
            onChange(step + 2);
            animate(x, step * GRID_STEP_PX, GRID_SPRING);
            isDragging.current = false;
          }}
          whileDrag={{ scale: 1.12 }}
          className="absolute top-1/2 -translate-y-1/2 rounded-xl shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 select-none"
        >
          <motion.span className="text-[9px] font-bold pointer-events-none" style={{ color: "var(--background)" }}>
            {displayValue}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

export function ExploreCanvas() {
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>([]);
  const [dims, setDims] = useState<Dims>({});
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"canvas" | "grid">("canvas");
  const [gridColumns, setGridColumns] = useState(4);
  // Always derive lightbox artifact from live artifacts array so reactions stay in sync
  const lightboxArtifact = lightboxOpen ? (artifacts[lightboxIndex] ?? null) : null;
  const sessionSeed = useRef(Math.floor(Math.random() * 1000000));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformRef = useRef<any>(null);
  const hascentered = useRef(false);

  useEffect(() => {
    fetch(`/api/feed?seed=${sessionSeed.current}`)
      .then((r) => r.json())
      .then(async (data: unknown) => {
        const items = Array.isArray(data) ? (data as FeedArtifact[]) : [];
        setArtifacts(items);
        const d = await loadDimensions(items);
        setDims(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const layout = useMemo(
    () => layoutArtifacts(artifacts, dims, sessionSeed.current),
    [artifacts, dims]
  );

  // Centre viewport on the artifact cluster once dims are loaded
  useEffect(() => {
    if (!transformRef.current || layout.items.length === 0 || hascentered.current) return;
    hascentered.current = true;

    const vmin = Math.min(window.innerWidth, window.innerHeight) * 0.1;
    const posX = window.innerWidth / 2 + vmin - layout.canvasWidth / 2;
    const posY = window.innerHeight / 2 + vmin - layout.canvasHeight / 2;
    transformRef.current.setTransform(posX, posY, 1, 0);
  }, [layout]);

  const handleReact = useCallback((artifactId: string, emoji: string, action: "added" | "removed") => {
    setArtifacts((prev) =>
      prev.map((a) => {
        if (a.id !== artifactId) return a;
        const newCounts = { ...a.reactionCounts };
        const newMine = [...a.myReactions];
        if (action === "added") {
          newCounts[emoji] = (newCounts[emoji] ?? 0) + 1;
          if (!newMine.includes(emoji)) newMine.push(emoji);
        } else {
          newCounts[emoji] = Math.max(0, (newCounts[emoji] ?? 0) - 1);
          if (newCounts[emoji] === 0) delete newCounts[emoji];
          const i = newMine.indexOf(emoji);
          if (i > -1) newMine.splice(i, 1);
        }
        return { ...a, reactionCounts: newCounts, myReactions: newMine };
      })
    );
  }, []);

  const openLightbox = useCallback(
    (artifact: FeedArtifact) => {
      const idx = artifacts.findIndex((a) => a.id === artifact.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [artifacts]
  );

  function navigateLightbox(dir: -1 | 1) {
    const next = lightboxIndex + dir;
    if (next < 0 || next >= artifacts.length) return;
    setLightboxIndex(next);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <LoadingDots size={10} gap={8} color="var(--foreground)" jumpHeight={14} />
        <p className="text-sm text-[var(--muted)]">Building artifacts...</p>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-center px-4">
        <div className="text-5xl">🌿</div>
        <div>
          <p className="text-base font-medium">Nothing shared yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Go to Projects, upload some work, and share it to the Explore feed.
          </p>
        </div>
      </div>
    );
  }

  // ── Shared floating controls (view toggle + column slider in grid mode) ──────
  const FloatingControls = (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-2 py-1.5 shadow-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {/* Column slider — only in grid mode */}
      {viewMode === "grid" && (
        <GridColumnSlider value={gridColumns} onChange={setGridColumns} />
      )}

      {/* Divider when slider is visible */}
      {viewMode === "grid" && <div className="w-px h-4 bg-[var(--border)] shrink-0" />}

      {/* View toggles */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setViewMode("canvas")}
          title="Infinite canvas"
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            viewMode === "canvas"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Compass size={15} weight={viewMode === "canvas" ? "fill" : "regular"} />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          title="Grid"
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            viewMode === "grid"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <SquaresFour size={15} weight={viewMode === "grid" ? "fill" : "regular"} />
        </button>
      </div>
    </div>
  );

  // ── Grid view ────────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <>
        {/* Scrollable grid — absolute so it fills the parent's overflow-hidden container */}
        <div
          className="absolute inset-0 overflow-y-auto px-6 pb-24"
          style={{ paddingTop: 80 }}
        >
          <div style={{ columnCount: gridColumns, columnGap: 12 }}>
            {artifacts.map((artifact) => {
              const purl = previewUrl(artifact);
              const isVideo =
                artifact.mediaMimeType?.startsWith("video/") ||
                (!!artifact.mediaUrl && artifact.mediaUrl.toLowerCase().includes("videodelivery.net"));

              return (
                <div
                  key={artifact.id}
                  className="break-inside-avoid mb-3 group cursor-pointer rounded-3xl overflow-hidden relative bg-[var(--surface-2)]"
                  style={{ minHeight: 120 }}
                  onClick={() => openLightbox(artifact)}
                >
                  {purl ? (
                    isVideo ? (
                      <video src={purl} autoPlay muted loop playsInline className="w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={purl} alt={artifact.name} className="w-full object-cover transition-opacity duration-200 group-hover:opacity-90" />
                    )
                  ) : (
                    <div className="w-full aspect-[4/3] flex items-center justify-center">
                      <span className="text-4xl opacity-20">
                        {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5 w-fit max-w-full overflow-hidden">
                      {artifact.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={artifact.user.image} alt={artifact.user.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-white">{artifact.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="text-xs font-medium text-white truncate">{artifact.user.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ArtifactLightbox
          artifact={lightboxArtifact}
          onClose={() => setLightboxOpen(false)}
          onReact={handleReact}
          onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
          onNext={lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
        />

        {FloatingControls}
      </>
    );
  }

  // ── Canvas view (default) ────────────────────────────────────────────────────
  return (
    <>
      <div
        className="absolute cursor-grab active:cursor-grabbing select-none overflow-hidden"
        style={{ inset: "-10vmin" }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={1}
          limitToBounds={false}
          panning={{ velocityDisabled: false }}
          wheel={{ disabled: true }}
          pinch={{ disabled: true }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{
              width: layout.canvasWidth,
              height: layout.canvasHeight,
              position: "relative",
              willChange: "transform",
            }}
          >
            <VirtualizedTiles layout={layout} onTileClick={openLightbox} onReact={handleReact} />
          </TransformComponent>
        </TransformWrapper>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-xs text-[var(--foreground)] opacity-60 pointer-events-none">
        Drag to explore
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxOpen(false)}
        onReact={handleReact}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={
          lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined
        }
      />

      {FloatingControls}
    </>
  );
}
