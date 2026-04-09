import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type") as any;
  const userId = searchParams.get("userId") ?? user.id;
  const sharedOnly = searchParams.get("shared") === "true";

  const artifacts = await prisma.artifact.findMany({
    where: {
      deletedAt: null,
      userId,
      ...(projectId ? { projectId } : {}),
      ...(type ? { type } : {}),
      ...(sharedOnly ? { isSharedToFeed: true } : {}),
    },
    include: { user: true, reactions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(artifacts.map((a) => serializeArtifact(a, user.id)));
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const artifact = await prisma.artifact.create({
    data: {
      name: body.name ?? "Untitled",
      description: body.description ?? null,
      type: body.type ?? "MEDIA",
      isShareable: body.type !== "INSPO",
      isSharedToFeed: false,
      storageBytes: body.storageBytes ?? 0,
      mediaUrl: body.mediaUrl ?? null,
      mediaMimeType: body.mediaMimeType ?? null,
      websiteUrl: body.websiteUrl ?? null,
      screenSize: body.screenSize ?? null,
      screenshotUrl: body.screenshotUrl ?? null,
      figmaUrl: body.figmaUrl ?? null,
      figmaPreviewUrl: body.figmaPreviewUrl ?? null,
      sourceUrl: body.sourceUrl ?? null,
      sourceCredit: body.sourceCredit ?? null,
      tags: body.tags ?? [],
      userId: user.id,
      projectId: body.projectId ?? null,
    },
    include: { user: true, reactions: true },
  });

  return NextResponse.json(serializeArtifact(artifact, user.id), { status: 201 });
}
