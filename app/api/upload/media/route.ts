import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/cloudflare";

const MAX_IMAGE_SIZE = 52428800; // 50MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToR2(key, buffer, file.type);

  return NextResponse.json({ url, key, mimeType: file.type, size: file.size });
}
