import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/mock-db";

const MAX_IMAGE_SIZE = 52428800;
const MAX_VIDEO_SIZE = 524288000;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const isVideo = file.type.startsWith("video/");
  const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (file.size > sizeLimit) {
    return NextResponse.json({ error: `File too large (max ${isVideo ? "500MB" : "50MB"})` }, { status: 413 });
  }

  // In mock mode: create a local object URL by returning a seed-based picsum URL
  const seed = generateId();
  const mockUrl = `https://picsum.photos/seed/${seed}/800/600`;

  return NextResponse.json({
    url: mockUrl,
    key: `mock/${seed}`,
    mimeType: file.type,
    size: file.size,
  });
}
