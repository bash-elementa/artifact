"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
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
const STEP_PX = 44;
const TRACK_W = (STEPS - 1) * STEP_PX; // 220px
const THUMB_SIZE = 32;

function ColumnSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const dragX = useMotionValue((value - 1) * STEP_PX);
  const springX = useSpring(dragX, { stiffness: 70, damping: 5, mass: 1.6 });

  useEffect(() => {
    dragX.set((value - 1) * STEP_PX);
  }, [value, dragX]);

  function snapToNearest() {
    const raw = dragX.get();
    const clamped = Math.max(0, Math.min(TRACK_W, raw));
    const step = Math.round(clamped / STEP_PX);
    dragX.set(step * STEP_PX);
    onChange(step + 1);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex items-center"
        style={{ width: TRACK_W + THUMB_SIZE, height: 48 }}
      >
        {/* Track */}
        <div
          className="absolute rounded-full bg-[var(--border)]"
          style={{ left: THUMB_SIZE / 2, right: THUMB_SIZE / 2, height: 2 }}
        />

        {/* Step dots */}
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200"
            style={{
              left: i * STEP_PX + THUMB_SIZE / 2 - 4,
              width: 8,
              height: 8,
              background: i < value ? "var(--foreground)" : "var(--border)",
              opacity: i < value ? 0.3 : 1,
            }}
          />
        ))}

        {/* Draggable thumb */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: TRACK_W }}
          dragElastic={0.12}
          dragMomentum={false}
          style={{ x: springX, left: 0 }}
          onDragEnd={snapToNearest}
          whileDrag={{ scale: 1.2 }}
          className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center rounded-full bg-[var(--foreground)] shadow-xl select-none"
        >
          <span className="text-[10px] font-bold text-[var(--background)] pointer-events-none">
            {value}
          </span>
        </motion.div>
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0">
        {value === 1 ? "1 column" : `${value} columns`}
      </span>
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
      <div className="w-full px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-8">
          <Link href="/projects" className="hover:text-[var(--foreground)] transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-medium">{project.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-[var(--muted)] max-w-md">{project.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted)]">
              {project._count.artifacts} {project._count.artifacts === 1 ? "artifact" : "artifacts"}
            </span>
            <button
              onClick={() => setUploadOpen(true)}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
            >
              + Upload
            </button>
          </div>
        </div>

        {/* Column slider */}
        {project.artifacts.length > 0 && (
          <div className="flex justify-center mb-6">
            <ColumnSlider value={columns} onChange={setColumns} />
          </div>
        )}

        {/* Masonry grid */}
        {project.artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🗂️</div>
            <div>
              <p className="text-base font-medium">No artifacts yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">Upload your first artifact to this project.</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black"
            >
              Upload artifact
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div
              className="gap-3 transition-all duration-300"
              style={{ columns, columnGap: 12 }}
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
