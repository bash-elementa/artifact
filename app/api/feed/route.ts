import { NextRequest, NextResponse } from "next/server";
import { artifacts, enrichArtifact } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

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
  const { searchParams } = new URL(req.url);
  const seed = searchParams.get("seed");

  const feedArtifacts = artifacts.filter(
    (a) => a.isSharedToFeed && a.isShareable && !a.deletedAt
  );

  const sessionSeed = seed ? parseInt(seed) : Date.now();
  const shuffled = seededShuffle(feedArtifacts, sessionSeed);

  const annotated = shuffled.map((a) => enrichArtifact(a, MOCK_USER.id));

  return NextResponse.json(annotated);
}
