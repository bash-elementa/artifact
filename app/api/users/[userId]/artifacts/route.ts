import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await getUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  const artifacts = await prisma.artifact.findMany({
    where: { userId, isSharedToFeed: true, isShareable: true, deletedAt: null },
    include: { user: true, reactions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(artifacts.map((a) => serializeArtifact(a, currentUser.id)));
}
