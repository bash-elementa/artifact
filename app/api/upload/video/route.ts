import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/mock-db";

const MAX_VIDEO_SIZE = 524288000;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video exceeds 500MB limit" }, { status: 413 });
  }

  // Mock: return a fake Stream UID
  const uid = generateId();
  return NextResponse.json({
    uid,
    playbackUrl: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
    thumbnailUrl: `https://picsum.photos/seed/${uid}/800/450`,
    size: file.size,
  });
}
