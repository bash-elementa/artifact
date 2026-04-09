import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";

const VALID_EMOJIS = ["👏", "✨", "🔥", "💡", "❤️"];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { artifactId, emoji } = body;

  if (!VALID_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, isSharedToFeed: true, deletedAt: null },
  });
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const existing = await prisma.reaction.findFirst({
    where: { userId: user.id, artifactId, emoji },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  } else {
    const reaction = await prisma.reaction.create({
      data: { emoji, userId: user.id, artifactId },
    });
    return NextResponse.json({
      action: "added",
      reaction: { ...reaction, createdAt: reaction.createdAt.toISOString() },
    });
  }
}
