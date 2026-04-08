import { NextRequest, NextResponse } from "next/server";
import { artifacts, enrichArtifact } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artifact = artifacts.find((a) => a.id === id && !a.deletedAt);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(enrichArtifact(artifact, MOCK_USER.id));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const idx = artifacts.findIndex((a) => a.id === id && a.userId === MOCK_USER.id && !a.deletedAt);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const artifact = artifacts[idx];

  if (body.isSharedToFeed && artifact.type === "INSPO") {
    return NextResponse.json({ error: "Inspo cannot be shared to feed" }, { status: 400 });
  }

  artifacts[idx] = {
    ...artifact,
    ...(body.name !== undefined && { name: body.name }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.isSharedToFeed !== undefined && { isSharedToFeed: body.isSharedToFeed }),
    ...(body.projectId !== undefined && { projectId: body.projectId }),
    ...(body.tags !== undefined && { tags: body.tags }),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(enrichArtifact(artifacts[idx], MOCK_USER.id));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = artifacts.findIndex((a) => a.id === id && a.userId === MOCK_USER.id && !a.deletedAt);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  artifacts[idx] = { ...artifacts[idx], deletedAt: new Date().toISOString() };
  return NextResponse.json({ success: true });
}
