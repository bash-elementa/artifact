import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";

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
      ...(body.isSharedToFeed !== undefined && { isSharedToFeed: body.isSharedToFeed }),
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
  await prisma.artifact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
