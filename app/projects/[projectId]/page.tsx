"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
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

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<Artifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);

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

  useEffect(() => {
    loadProject();
  }, [loadProject]);

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
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] aspect-[4/3] animate-pulse" />
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
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-6">
          <Link href="/projects" className="hover:text-[var(--foreground)] transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-medium">{project.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-[var(--muted)] mt-1">{project.description}</p>
            )}
            <p className="text-xs text-[var(--muted)] mt-1">{project._count.artifacts} artifact{project._count.artifacts !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            + Upload
          </button>
        </div>

        {/* Artifacts */}
        {project.artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🗂️</div>
            <div>
              <p className="text-base font-medium">No artifacts yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">Upload your first artifact to this project.</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black"
            >
              Upload artifact
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onClick={() => openLightbox(artifact)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Lightbox */}
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
