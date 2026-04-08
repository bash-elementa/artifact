import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { id: "mock-user-1" },
    update: {},
    create: {
      id: "mock-user-1",
      email: "alex@bash.com",
      name: "Alex Bash",
      role: "Product Designer",
      team: "XD",
      bio: "Building cool things at Bash.",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "mock-project-1" },
    update: {},
    create: {
      id: "mock-project-1",
      name: "Brand Refresh 2026",
      description: "Visual explorations for the new Bash brand direction.",
      userId: "mock-user-1",
    },
  });

  console.log("Seeded mock user and project:", { project });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
