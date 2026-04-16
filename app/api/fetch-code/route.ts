import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Only allow fetching from our own R2 bucket
  if (ALLOWED_HOST && !url.startsWith(ALLOWED_HOST)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const content = await res.text();
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Failed to fetch code" }, { status: 502 });
  }
}
