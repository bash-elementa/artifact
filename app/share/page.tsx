import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ShareRedirect from "./ShareRedirect";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ artifact?: string }>;
}): Promise<Metadata> {
  const { artifact: artifactId } = await searchParams;
  if (!artifactId) return { title: "/artifact" };

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, deletedAt: null },
    include: { user: { select: { name: true } } },
  }).catch(() => null);

  if (!artifact) return { title: "/artifact" };

  const imageUrl =
    artifact.screenshotUrl ??
    (artifact as any).figmaPreviewUrl ??
    artifact.mediaUrl ??
    null;

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

export default function SharePage() {
  return (
    <Suspense>
      <ShareRedirect />
    </Suspense>
  );
}
