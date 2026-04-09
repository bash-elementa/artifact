import { NextRequest, NextResponse } from "next/server";
import { uploadVideoToStream } from "@/lib/cloudflare";

const MAX_VIDEO_SIZE = 524288000; // 500MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video exceeds 500MB limit" }, { status: 413 });
  }

  const streamFormData = new FormData();
  streamFormData.append("file", file);

  const result = await uploadVideoToStream(streamFormData);

  return NextResponse.json({
    uid: result.uid,
    playbackUrl: result.playback.hls,
    thumbnailUrl: `https://videodelivery.net/${result.uid}/thumbnails/thumbnail.jpg`,
    size: file.size,
  });
}
