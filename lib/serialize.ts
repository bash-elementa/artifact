export function serializeArtifact(a: any, currentUserId?: string) {
  const myReactions = (a.reactions ?? [])
    .filter((r: any) => currentUserId && r.userId === currentUserId)
    .map((r: any) => r.emoji);
  const reactionCounts = (a.reactions ?? []).reduce(
    (acc: Record<string, number>, r: any) => {
      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return {
    ...a,
    storageBytes: Number(a.storageBytes),
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
    deletedAt: a.deletedAt instanceof Date ? a.deletedAt.toISOString() : (a.deletedAt ?? null),
    user: a.user
      ? { id: a.user.id, name: a.user.name, role: a.user.role, team: a.user.team, image: a.user.image }
      : null,
    myReactions,
    reactionCounts,
  };
}

export function serializeProject(p: any, currentUserId?: string) {
  return {
    ...p,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    artifacts: (p.artifacts ?? []).map((a: any) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      mediaUrl: a.mediaUrl,
      figmaPreviewUrl: a.figmaPreviewUrl,
      screenshotUrl: a.screenshotUrl,
    })),
    _count: { artifacts: p._count?.artifacts ?? (p.artifacts?.length ?? 0) },
    contributors: (p.contributors ?? []).map((c: any) => ({
      id: c.user.id,
      name: c.user.name,
      image: c.user.image,
    })),
    isOwner: currentUserId !== undefined ? p.userId === currentUserId : true,
  };
}
