import { NextRequest, NextResponse } from "next/server";
import { artifacts, reactions, generateId } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

const VALID_EMOJIS = ["👏", "✨", "🔥", "💡", "❤️"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artifactId, emoji } = body;

  if (!VALID_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const artifact = artifacts.find((a) => a.id === artifactId && a.isSharedToFeed && !a.deletedAt);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const existingIdx = reactions.findIndex(
    (r) => r.userId === MOCK_USER.id && r.artifactId === artifactId && r.emoji === emoji
  );

  if (existingIdx !== -1) {
    reactions.splice(existingIdx, 1);
    return NextResponse.json({ action: "removed" });
  } else {
    const reaction = {
      id: generateId(),
      emoji,
      userId: MOCK_USER.id,
      artifactId,
      createdAt: new Date().toISOString(),
    };
    reactions.push(reaction);
    return NextResponse.json({ action: "added", reaction });
  }
}
