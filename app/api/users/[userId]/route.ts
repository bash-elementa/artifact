import { NextRequest, NextResponse } from "next/server";
import { USERS } from "@/lib/mock-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const user = USERS.find((u) => u.id === userId);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    team: user.team,
    bio: user.bio,
  });
}
