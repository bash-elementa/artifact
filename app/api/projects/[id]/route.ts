import { NextRequest, NextResponse } from "next/server";
import { projects, artifacts, enrichArtifact } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id && p.userId === MOCK_USER.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectArtifacts = artifacts
    .filter((a) => a.projectId === id && !a.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => enrichArtifact(a, MOCK_USER.id));

  return NextResponse.json({
    ...project,
    artifacts: projectArtifacts,
    _count: { artifacts: projectArtifacts.length },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const idx = projects.findIndex((p) => p.id === id && p.userId === MOCK_USER.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  projects[idx] = {
    ...projects[idx],
    ...(body.name && { name: body.name }),
    ...(body.description !== undefined && { description: body.description }),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(projects[idx]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = projects.findIndex((p) => p.id === id && p.userId === MOCK_USER.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  projects.splice(idx, 1);
  return NextResponse.json({ success: true });
}
