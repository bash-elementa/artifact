import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, team, role, avatarUrl } = await req.json();
  if (!team?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "Team and role are required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      team: team.trim(),
      role: role.trim(),
      ...(name?.trim() && { name: name.trim() }),
      ...(avatarUrl && { image: avatarUrl }),
    },
  });

  return NextResponse.json({ ok: true });
}
