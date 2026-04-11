import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreCanvas } from "@/components/explore/ExploreCanvas";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(
  props: { searchParams: Promise<{ artifact?: string }> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const artifactId = searchParams?.artifact;
  if (!artifactId) return { title: "/artifact — Explore" };

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, deletedAt: null },
    include: { user: { select: { name: true } } },
  }).catch(() => null);

  if (!artifact) return { title: "/artifact — Explore" };

  const imageUrl =
    artifact.screenshotUrl ??
    (artifact as any).figmaPreviewUrl ??
    artifact.mediaUrl ??
    null;

  const title = artifact.name;
  const description = artifact.description
    ? `${artifact.description} — shared by ${artifact.user?.name ?? "a teammate"}`
    : `Shared by ${artifact.user?.name ?? "a teammate"} on /artifact`;

  const pageUrl = `/explore?artifact=${artifactId}`;

  return {
    title: `${title} — /artifact`,
    description,
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      siteName: "/artifact",
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function ExplorePage() {
  return (
    <div className="relative flex-1 w-full h-full overflow-hidden">
      <Suspense>
        <ExploreCanvas />
      </Suspense>
    </div>
  );
}
