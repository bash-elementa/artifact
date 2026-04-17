import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";
import { deleteFromR2, deleteFromStream, r2KeyFromUrl } from "@/lib/cloudflare";

function streamUidFromUrl(url: string): string | null {
  return url.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i)?.[1] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artifact = await prisma.artifact.findFirst({
    where: { id, deletedAt: null },
    include: { user: true, reactions: true },
  });
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json(serializeArtifact(artifact, user?.id));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.isSharedToFeed) {
    const existing = await prisma.artifact.findFirst({ where: { id, userId: user.id, deletedAt: null } });
    if (existing?.type === "INSPO") {
      return NextResponse.json({ error: "Inspo cannot be shared to feed" }, { status: 400 });
    }
  }

  const artifact = await prisma.artifact.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isSharedToFeed !== undefined && {
        isSharedToFeed: body.isSharedToFeed,
        sharedToFeedAt: body.isSharedToFeed ? new Date() : null,
      }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      ...(body.tags !== undefined && { tags: body.tags }),
    },
    include: { user: true, reactions: true },
  });

  return NextResponse.json(serializeArtifact(artifact, user.id));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const artifact = await prisma.artifact.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete the record immediately so it's gone from the user's perspective
  await prisma.artifact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Clean up Cloudflare storage in the background — non-blocking
  const cleanups: Promise<void>[] = [];

  if (artifact.mediaUrl) {
    const isVideo =
      artifact.mediaMimeType?.startsWith("video/") ||
      /videodelivery\.net|cloudflarestream\.com/.test(artifact.mediaUrl);
    if (isVideo) {
      const uid = streamUidFromUrl(artifact.mediaUrl);
      if (uid) cleanups.push(deleteFromStream(uid).catch(console.error));
    } else {
      const key = r2KeyFromUrl(artifact.mediaUrl);
      if (key) cleanups.push(deleteFromR2(key).catch(console.error));
    }
  }

  // Screenshots and Figma previews stored in R2 (Stream thumbnails won't match r2KeyFromUrl)
  for (const url of [artifact.screenshotUrl, artifact.figmaPreviewUrl]) {
    if (!url) continue;
    const key = r2KeyFromUrl(url);
    if (key) cleanups.push(deleteFromR2(key).catch(console.error));
  }

  Promise.all(cleanups).catch(console.error);

  return NextResponse.json({ success: true });
}
