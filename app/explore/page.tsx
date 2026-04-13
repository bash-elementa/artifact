import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExploreCanvas } from "@/components/explore/ExploreCanvas";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ artifact?: string }>;
}): Promise<Metadata> {
  const { artifact: artifactId } = await searchParams;
  if (!artifactId) return {};

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, deletedAt: null },
    include: { user: { select: { name: true } } },
  }).catch(() => null);

  if (!artifact) return {};

  const imageUrl =
    artifact.screenshotUrl ??
    (artifact as any).figmaPreviewUrl ??
    artifact.mediaUrl ??
    "https://artifact-bash.vercel.app/artifact-banner.png";

  const title = artifact.name;
  const description = artifact.description
    ? `${artifact.description} — shared by ${artifact.user?.name ?? "a teammate"}`
    : `Shared by ${artifact.user?.name ?? "a teammate"} on /artifact`;

  return {
    title: `${title} — /artifact`,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      siteName: "/artifact",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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
