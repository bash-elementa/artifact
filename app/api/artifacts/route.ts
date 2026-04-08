import { NextRequest, NextResponse } from "next/server";
import { artifacts, enrichArtifact, generateId, USERS } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");
  const userId = searchParams.get("userId") ?? MOCK_USER.id;
  const sharedOnly = searchParams.get("shared") === "true";

  const filtered = artifacts.filter((a) => {
    if (a.deletedAt) return false;
    if (a.userId !== userId) return false;
    if (projectId && a.projectId !== projectId) return false;
    if (type && a.type !== type) return false;
    if (sharedOnly && !a.isSharedToFeed) return false;
    return true;
  });

  const enriched = filtered
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => enrichArtifact(a, MOCK_USER.id));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const artifact = {
    id: generateId(),
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
    userId: MOCK_USER.id,
    projectId: body.projectId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  artifacts.push(artifact);

  return NextResponse.json(enrichArtifact(artifact, MOCK_USER.id), { status: 201 });
}
