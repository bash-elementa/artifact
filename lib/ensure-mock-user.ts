import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/mock-user";

export async function ensureMockUser() {
  await prisma.user.upsert({
    where: { email: MOCK_USER.email },
    update: {},
    create: {
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      name: MOCK_USER.name,
      image: MOCK_USER.image,
      role: MOCK_USER.role,
      team: "XD",
      bio: MOCK_USER.bio,
    },
  });
}
