import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const wait = req.nextUrl.searchParams.get("wait");

  try {
    const microlinkUrl = new URL("https://api.microlink.io");
    microlinkUrl.searchParams.set("url", url);
    microlinkUrl.searchParams.set("screenshot", "true");
    microlinkUrl.searchParams.set("meta", "false");
    if (wait) microlinkUrl.searchParams.set("waitForTimeout", wait);

    const resp = await fetch(microlinkUrl.toString(), { signal: AbortSignal.timeout(30000) });
    const data = await resp.json();
    const screenshotUrl = data?.data?.screenshot?.url;
    if (screenshotUrl) return NextResponse.json({ url: screenshotUrl });
  } catch {
    // fall through
  }

  return NextResponse.json({ error: "Failed to capture screenshot" }, { status: 502 });
}
