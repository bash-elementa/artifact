import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },
        { contributors: { some: { userId: user.id } } },
      ],
    },
    include: {
      contributors: { include: { user: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const artifacts = await prisma.artifact.findMany({
    where: { projectId: id, deletedAt: null },
    include: { user: true, reactions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    artifacts: artifacts.map((a) => serializeArtifact(a, user.id)),
    _count: { artifacts: artifacts.length },
    contributors: project.contributors.map((c) => ({
      id: c.user.id,
      name: c.user.name,
      image: c.user.image,
    })),
    isOwner: project.userId === user.id,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });

  return NextResponse.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Only the owner can delete
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  await prisma.$transaction([
    // Soft-delete all artifacts in the project and remove them from the feed
    prisma.artifact.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: new Date(), isSharedToFeed: false },
    }),
    // Delete the project itself
    prisma.project.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
