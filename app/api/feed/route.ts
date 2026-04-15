import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeArtifact } from "@/lib/serialize";

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seed = searchParams.get("seed");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const feedArtifacts = await prisma.artifact.findMany({
    where: {
      isSharedToFeed: true,
      isShareable: true,
      deletedAt: null,
      sharedToFeedAt: { gte: thirtyDaysAgo },
    },
    include: { user: true, reactions: true },
  });

  const sessionSeed = seed ? parseInt(seed) : Date.now();
  const shuffled = seededShuffle(feedArtifacts, sessionSeed);

  return NextResponse.json(shuffled.map((a) => serializeArtifact(a, user.id)));
}
