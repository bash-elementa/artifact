"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import { createClient } from "@/lib/supabase/client";

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
  contributors: { id: string; name: string | null; image: string | null }[];
  isOwner: boolean;
}

export function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id);
    });
  }, []);

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

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1.5 mb-2">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        {!loading && (
          <p className="text-sm text-[var(--muted)]">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="rounded-xl bg-[var(--surface-2)] aspect-[4/3] animate-pulse" />
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="rounded-lg bg-[var(--surface-2)] aspect-[4/3] animate-pulse" />
                ))}
              </div>
              <div className="h-3.5 w-1/2 rounded-full bg-[var(--surface-2)] animate-pulse mt-1 mx-0.5" />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
            ))}
            {/* New project tile */}
            <button
              onClick={() => setNewProjectOpen(true)}
              className="group flex flex-col gap-1.5 text-left"
            >
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-[var(--surface)] border border-dashed border-[var(--border)] group-hover:border-[var(--muted)] group-hover:bg-[var(--surface-2)] transition-all duration-200 flex items-center justify-center">
                <span className="text-3xl text-[var(--border)] group-hover:text-[var(--muted)] transition-colors duration-200">+</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-lg aspect-[4/3] bg-[var(--surface)] border border-dashed border-[var(--border)] group-hover:border-[var(--muted)] transition-colors duration-200" />
                ))}
              </div>
              <div className="mt-1 px-0.5">
                <p className="text-sm font-semibold text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors duration-200">New project</p>
              </div>
            </button>
          </div>
        </AnimatePresence>
      )}

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={handleNewProject}
        currentUserId={currentUserId}
      />

    </div>
  );
}
