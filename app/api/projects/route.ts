import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeProject } from "@/lib/serialize";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId: user.id },
        { contributors: { some: { userId: user.id } } },
      ],
    },
    include: {
      artifacts: {
        where: { deletedAt: null },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, name: true, mediaUrl: true, figmaPreviewUrl: true, screenshotUrl: true },
      },
      _count: { select: { artifacts: { where: { deletedAt: null } } } },
      contributors: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects.map((p) => serializeProject(p, user.id)));
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const contributorIds: string[] = (body.contributorIds ?? []).filter(
    (id: string) => id !== user.id
  );

  const project = await prisma.project.create({
    data: {
      name: body.name ?? "Untitled",
      description: body.description ?? null,
      userId: user.id,
      ...(contributorIds.length > 0 && {
        contributors: {
          create: contributorIds.map((userId: string) => ({ userId })),
        },
      }),
    },
    include: {
      artifacts: {
        where: { deletedAt: null },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, name: true, mediaUrl: true, figmaPreviewUrl: true, screenshotUrl: true },
      },
      _count: { select: { artifacts: { where: { deletedAt: null } } } },
      contributors: { include: { user: true } },
    },
  });

  return NextResponse.json(serializeProject(project, user.id), { status: 201 });
}
