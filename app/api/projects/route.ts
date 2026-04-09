import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/get-user";
import { serializeProject } from "@/lib/serialize";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      artifacts: {
        where: { deletedAt: null },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, name: true, mediaUrl: true, figmaPreviewUrl: true, screenshotUrl: true },
      },
      _count: { select: { artifacts: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects.map(serializeProject));
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      name: body.name ?? "Untitled",
      description: body.description ?? null,
      userId: user.id,
    },
    include: {
      artifacts: {
        where: { deletedAt: null },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, name: true, mediaUrl: true, figmaPreviewUrl: true, screenshotUrl: true },
      },
      _count: { select: { artifacts: { where: { deletedAt: null } } } },
    },
  });

  return NextResponse.json(serializeProject(project), { status: 201 });
}
