import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json(null);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { team: true, role: true },
  });

  return NextResponse.json(dbUser);
}
