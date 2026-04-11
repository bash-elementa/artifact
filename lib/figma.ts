/**
 * Figma REST API helper for fetching static previews.
 * Uses the XD-team-owned service account token.
 */

function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

/**
 * Extracts the node-id from a Figma URL query string.
 * Figma URLs use dashes (e.g. "123-456") which the Images API also accepts.
 * Works for both design links (?node-id=...) and prototype links (?node-id=...).
 */
function extractFigmaNodeId(url: string): string | null {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get("node-id");
  } catch {
    return null;
  }
}

export async function getFigmaStaticPreview(figmaUrl: string): Promise<string | null> {
  const token = process.env.FIGMA_SERVICE_TOKEN;
  if (!token) return null;

  const fileKey = extractFigmaFileKey(figmaUrl);
  if (!fileKey) return null;

  const nodeId = extractFigmaNodeId(figmaUrl);
  // Figma URLs encode node IDs with dashes ("1519-2") but the API response
  // keys them with colons ("1519:2"). Convert for the lookup.
  const apiNodeId = nodeId ? nodeId.replace(/-/g, ":") : null;

  try {
    // If the URL points to a specific frame or prototype starting node,
    // render that exact node instead of the file cover thumbnail.
    if (apiNodeId) {
      const imgRes = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(apiNodeId)}&format=png&scale=2`,
        { headers: { "X-Figma-Token": token } }
      );

      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const nodeUrl = imgData.images?.[apiNodeId];
        if (nodeUrl) return nodeUrl as string;
      }
    }

    // No node-id (plain file/design link) — use the file's cover thumbnail.
    const fileRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}?depth=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!fileRes.ok) return null;

    const file = await fileRes.json();
    if (file.thumbnailUrl) return file.thumbnailUrl as string;

    // Last resort: export the first page as PNG
    const firstPageId = file.document?.children?.[0]?.id;
    if (!firstPageId) return null;

    const fallbackRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${firstPageId}&format=png&scale=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!fallbackRes.ok) return null;

    const fallbackData = await fallbackRes.json();
    return fallbackData.images?.[firstPageId] ?? null;
  } catch {
    return null;
  }
}
