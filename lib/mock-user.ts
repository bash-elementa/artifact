export const MOCK_USER = {
  id: "mock-user-1",
  name: "Alex Bash",
  email: "alex@bash.com",
  image: null as string | null,
  role: "Product Designer",
  team: "XD",
  bio: "Building cool things at Bash.",
};

export type MockUser = typeof MOCK_USER;
