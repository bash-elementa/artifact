"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArtifactCard } from "@/components/projects/ArtifactCard";
import { ArtifactLightbox } from "@/components/explore/ArtifactLightbox";
import { UploadModal } from "@/components/upload/UploadModal";

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
  reactions: { emoji: string }[];
  user: { id: string; name: string; role: string; team: string; image: string | null };
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  artifacts: Artifact[];
  _count: { artifacts: number };
}

const STEPS = 6;
const STEP_PX = 40;
const TRACK_W = (STEPS - 1) * STEP_PX; // 200px
const THUMB = 32;

const SPRING = { type: "spring" as const, stiffness: 70, damping: 5, mass: 1.6 };

function ColumnSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const x = useMotionValue((value - 1) * STEP_PX);
  const displayValue = useTransform(x, (v) => Math.round(Math.max(0, Math.min(TRACK_W, v)) / STEP_PX) + 1);
  const isDragging = useRef(false);

  // Only snap externally when not mid-drag
  useEffect(() => {
    if (isDragging.current) return;
    animate(x, (value - 1) * STEP_PX, SPRING);
  }, [value, x]);

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDrag() {
    const raw = Math.max(0, Math.min(TRACK_W, x.get()));
    const newVal = Math.round(raw / STEP_PX) + 1;
    onChange(newVal);
  }

  function handleDragEnd() {
    const raw = Math.max(0, Math.min(TRACK_W, x.get()));
    const step = Math.round(raw / STEP_PX);
    onChange(step + 1);
    animate(x, step * STEP_PX, SPRING);
    isDragging.current = false;
  }

  const PAD = 6;

  return (
    <div className="rounded-full bg-[var(--surface-2)] flex items-center" style={{ padding: PAD, height: THUMB + PAD * 2 }}>
      <div className="relative flex items-center" style={{ width: TRACK_W + THUMB, height: THUMB }}>
        {/* Track line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: THUMB / 2, width: TRACK_W, height: 2, background: "var(--border)" }}
        />
        {/* Dots */}
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--muted)]"
            style={{
              left: i * STEP_PX + THUMB / 2 - 4,
              width: 8, height: 8,
              opacity: 0.45,
            }}
          />
        ))}
        {/* Thumb */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: TRACK_W }}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x, left: 0, width: THUMB, height: THUMB }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.12 }}
          className="absolute top-1/2 -translate-y-1/2 rounded-2xl bg-[var(--foreground)] shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 select-none"
        >
          <motion.span className="text-[11px] font-bold text-[var(--background)] pointer-events-none">
            {displayValue}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<Artifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [columns, setColumns] = useState(3);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      setProject(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  function openLightbox(artifact: Artifact) {
    const idx = project?.artifacts.findIndex((a) => a.id === artifact.id) ?? 0;
    setLightboxIndex(idx);
    setLightboxArtifact(artifact);
  }

  function navigateLightbox(dir: -1 | 1) {
    if (!project) return;
    const next = lightboxIndex + dir;
    if (next < 0 || next >= project.artifacts.length) return;
    setLightboxIndex(next);
    setLightboxArtifact(project.artifacts[next]);
  }

  function handleDelete(id: string) {
    setProject((prev) =>
      prev ? { ...prev, artifacts: prev.artifacts.filter((a) => a.id !== id) } : prev
    );
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface-2)] animate-pulse mb-8" />
        <div className="columns-3 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-[var(--surface-2)] animate-pulse"
              style={{ height: [220, 300, 180, 260, 240, 200, 280, 220][i] }} />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[var(--muted)]">Project not found.</p>
        <Link href="/projects" className="mt-4 text-sm text-[var(--accent)] underline">Back to Projects</Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-6 pt-24 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 gap-1.5">
          <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {project._count.artifacts} {project._count.artifacts === 1 ? "artifact" : "artifacts"}
          </p>
        </div>

        {/* Slider + Upload button */}
        {project.artifacts.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <ColumnSlider value={columns} onChange={setColumns} />
            <button
              onClick={() => setUploadOpen(true)}
              className="w-11 h-11 rounded-full bg-white text-black text-xl font-light flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
              aria-label="Upload artifact"
            >
              +
            </button>
          </div>
        )}

        {/* Masonry grid */}
        {project.artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🗂️</div>
            <div>
              <p className="text-base font-medium">No artifacts yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">Hit the + button above to upload your first artifact.</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="w-11 h-11 rounded-full bg-white text-black text-xl font-light flex items-center justify-center hover:opacity-90 transition-opacity"
              aria-label="Upload artifact"
            >
              +
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div
              className="gap-3 transition-all duration-300"
              style={{ columnCount: columns, columnGap: 12 }}
            >
              {project.artifacts.map((artifact) => (
                <div key={artifact.id} className="break-inside-avoid mb-3">
                  <ArtifactCard
                    artifact={artifact}
                    onClick={() => openLightbox(artifact)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxArtifact(null)}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={project && lightboxIndex < project.artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultProjectId={projectId}
        onSuccess={loadProject}
      />
    </>
  );
}
