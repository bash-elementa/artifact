import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, ensureR2Cors } from "@/lib/cloudflare";

export async function POST(req: NextRequest) {
  const { ext, contentType } = await req.json();
  if (!ext || !contentType) {
    return NextResponse.json({ error: "ext and contentType required" }, { status: 400 });
  }

  const key = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL ?? ""}/${key}`;

  try {
    await ensureR2Cors();
    const presignedUrl = await getPresignedUploadUrl(key, contentType);
    return NextResponse.json({ presignedUrl, publicUrl, key });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate upload URL";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
