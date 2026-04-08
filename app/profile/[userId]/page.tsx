"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ArtifactLightbox } from "@/components/explore/ArtifactLightbox";
import { timeAgo } from "@/lib/utils";

interface Artifact {
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
  myReactions?: string[];
  reactionCounts?: Record<string, number>;
  reactions: { emoji: string; userId: string }[];
  user: { id: string; name: string; role?: string | null; team?: string | null; image?: string | null };
}

interface ProfileUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  team?: string | null;
  bio?: string | null;
}

function getPreviewUrl(a: Artifact): string | null {
  if (a.type === "MEDIA" && a.mediaUrl) return a.mediaUrl;
  if (a.type === "FIGMA" && a.figmaPreviewUrl) return a.figmaPreviewUrl;
  if (a.type === "URL" && a.screenshotUrl) return a.screenshotUrl;
  return null;
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<Artifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch user profile and their shared artifacts
        const [userRes, artifactsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/artifacts?userId=${userId}&shared=true`),
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (artifactsRes.ok) {
          const data: Artifact[] = await artifactsRes.json();
          // Annotate reactions for current user
          const annotated = data.map((a) => ({
            ...a,
            myReactions: a.reactions.filter((r) => r.userId === userId).map((r) => r.emoji),
            reactionCounts: a.reactions.reduce((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          }));
          setArtifacts(annotated);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  function openLightbox(artifact: Artifact) {
    const idx = artifacts.findIndex((a) => a.id === artifact.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxArtifact(artifact);
  }

  function navigateLightbox(dir: -1 | 1) {
    const next = lightboxIndex + dir;
    if (next < 0 || next >= artifacts.length) return;
    setLightboxIndex(next);
    setLightboxArtifact(artifacts[next]);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] animate-pulse" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 w-40 rounded-lg bg-[var(--surface)] animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-[var(--surface)] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] aspect-[4/3] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[var(--muted)]">User not found.</p>
        <Link href="/explore" className="mt-4 text-sm text-[var(--accent)] underline">Back to Explore</Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        {/* Profile header */}
        <div className="mb-10">
          <ProfileCard user={user} artifactCount={artifacts.length} />
        </div>

        {/* Artifacts masonry-style grid */}
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="text-4xl opacity-30">🌿</div>
            <p className="text-sm text-[var(--muted)]">No shared artifacts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {artifacts.map((artifact) => {
              const previewUrl = getPreviewUrl(artifact);
              return (
                <div
                  key={artifact.id}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--muted)] transition-all duration-200"
                  onClick={() => openLightbox(artifact)}
                >
                  <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={artifact.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-20">
                          {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium leading-snug line-clamp-1">{artifact.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{timeAgo(artifact.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxArtifact(null)}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
      />
    </>
  );
}
