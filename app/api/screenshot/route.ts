import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const resp = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`,
      { signal: AbortSignal.timeout(20000) }
    );
    const data = await resp.json();
    const screenshotUrl = data?.data?.screenshot?.url;
    if (screenshotUrl) return NextResponse.json({ url: screenshotUrl });
  } catch {
    // fall through
  }

  return NextResponse.json({ error: "Failed to capture screenshot" }, { status: 502 });
}
