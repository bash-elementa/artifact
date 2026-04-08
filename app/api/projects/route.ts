import { NextRequest, NextResponse } from "next/server";
import { projects, enrichProject, generateId } from "@/lib/mock-db";
import { MOCK_USER } from "@/lib/mock-user";

export async function GET() {
  const mine = projects
    .filter((p) => p.userId === MOCK_USER.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(enrichProject);

  return NextResponse.json(mine);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const project = {
    id: generateId(),
    name: body.name ?? "Untitled",
    description: body.description ?? null,
    userId: MOCK_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.push(project);
  return NextResponse.json(enrichProject(project), { status: 201 });
}
