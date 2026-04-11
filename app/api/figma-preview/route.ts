import { NextRequest, NextResponse } from "next/server";
import { getFigmaStaticPreview } from "@/lib/figma";

export async function POST(req: NextRequest) {
  const { figmaUrl } = await req.json();
  if (!figmaUrl) return NextResponse.json({ error: "figmaUrl required" }, { status: 400 });

  const result = await getFigmaStaticPreview(figmaUrl);

  if (!result) {
    return NextResponse.json({ error: "Could not fetch preview" }, { status: 502 });
  }

  return NextResponse.json({
    previewUrl: result.previewUrl,
    width: result.width,
    height: result.height,
  });
}
