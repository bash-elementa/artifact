"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import { UploadModal } from "@/components/upload/UploadModal";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  artifacts: {
    id: string;
    mediaUrl?: string | null;
    figmaPreviewUrl?: string | null;
    screenshotUrl?: string | null;
    type: string;
    name: string;
  }[];
  _count: { artifacts: number };
}

export function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleNewProject(project: { id: string; name: string }) {
    loadProjects();
    setNewProjectOpen(false);
    void project;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Your private workspace</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
          >
            + Upload artifact
          </button>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            + New project
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] aspect-[4/3] animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="text-5xl">📁</div>
          <div>
            <p className="text-base font-medium">No projects yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">Create a project to organise your work, or upload an artifact directly.</p>
          </div>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="mt-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={handleNewProject}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
}
