import { NextResponse } from "next/server";
import { getCFStreamDirectUploadUrl } from "@/lib/cloudflare";

export async function POST() {
  try {
    const { uploadUrl, uid } = await getCFStreamDirectUploadUrl();
    return NextResponse.json({ uploadUrl, uid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get upload token";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
