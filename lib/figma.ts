/**
 * Figma REST API helper for fetching static previews.
 * Uses the XD-team-owned service account token.
 */

function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

export async function getFigmaStaticPreview(figmaUrl: string): Promise<string | null> {
  const token = process.env.FIGMA_SERVICE_TOKEN;
  if (!token) return null;

  const fileKey = extractFigmaFileKey(figmaUrl);
  if (!fileKey) return null;

  try {
    // First get the file to find the first page/frame
    const fileRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}?depth=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!fileRes.ok) return null;

    const file = await fileRes.json();

    // Use the built-in thumbnail Figma generates for the file — most reliable
    if (file.thumbnailUrl) return file.thumbnailUrl as string;

    // Fallback: export the first page as PNG
    const firstPageId = file.document?.children?.[0]?.id;
    if (!firstPageId) return null;

    const imgRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${firstPageId}&format=png&scale=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!imgRes.ok) return null;

    const imgData = await imgRes.json();
    return imgData.images?.[firstPageId] ?? null;
  } catch {
    return null;
  }
}
