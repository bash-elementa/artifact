"use client";

interface ProfileUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  team?: string | null;
  bio?: string | null;
}

interface ProfileCardProps {
  user: ProfileUser;
  artifactCount: number;
}

export function ProfileCard({ user, artifactCount }: ProfileCardProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("") ?? "?";

  return (
    <div className="flex items-start gap-5">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xl font-semibold text-[var(--muted)] shrink-0">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? ""} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-xl font-semibold">{user.name ?? user.email}</h1>
        {user.role && (
          <p className="text-sm text-[var(--muted)]">
            {user.role}
            {user.team && <span> · {user.team}</span>}
          </p>
        )}
        {user.bio && <p className="text-sm text-[var(--muted)] mt-1">{user.bio}</p>}
        <p className="text-xs text-[var(--muted)] mt-1">{artifactCount} artifact{artifactCount !== 1 ? "s" : ""} shared</p>
      </div>
    </div>
  );
}
