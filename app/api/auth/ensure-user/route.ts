import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";

export async function POST() {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { team: true },
  });
  const hasCompletedOnboarding = !!existing?.team;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      // Only sync Google metadata before onboarding is complete — after that,
      // the user's own choices from /hello take priority.
      ...(!hasCompletedOnboarding && {
        name: user.user_metadata?.full_name ?? user.email.split("@")[0],
        image: user.user_metadata?.avatar_url ?? null,
      }),
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email.split("@")[0],
      image: user.user_metadata?.avatar_url ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
