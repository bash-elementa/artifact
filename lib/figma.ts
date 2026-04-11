/**
 * Figma REST API helper for fetching static previews.
 * Uses the XD-team-owned service account token.
 */

export type FigmaPreviewResult = {
  previewUrl: string;
  width: number | null;
  height: number | null;
};

function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

/**
 * Extracts the node-id from a Figma URL query string.
 * Figma URLs use dashes (e.g. "123-456"); the API uses colons ("123:456").
 */
function extractFigmaNodeId(url: string): string | null {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get("node-id");
  } catch {
    return null;
  }
}

export async function getFigmaStaticPreview(figmaUrl: string): Promise<FigmaPreviewResult | null> {
  const token = process.env.FIGMA_SERVICE_TOKEN;
  if (!token) return null;

  const fileKey = extractFigmaFileKey(figmaUrl);
  if (!fileKey) return null;

  const nodeId = extractFigmaNodeId(figmaUrl);
  // Figma URLs use dashes ("1519-2") but the API keys responses with colons ("1519:2").
  const apiNodeId = nodeId ? nodeId.replace(/-/g, ":") : null;

  try {
    if (apiNodeId) {
      // Fetch the node image and its bounding box dimensions in parallel.
      const [imgRes, nodeRes] = await Promise.all([
        fetch(
          `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(apiNodeId)}&format=png&scale=2`,
          { headers: { "X-Figma-Token": token } }
        ),
        fetch(
          `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(apiNodeId)}&depth=1`,
          { headers: { "X-Figma-Token": token } }
        ),
      ]);

      let previewUrl: string | null = null;
      let width: number | null = null;
      let height: number | null = null;

      if (imgRes.ok) {
        const imgData = await imgRes.json();
        previewUrl = imgData.images?.[apiNodeId] ?? null;
      }

      if (nodeRes.ok) {
        const nodeData = await nodeRes.json();
        const bbox = nodeData.nodes?.[apiNodeId]?.document?.absoluteBoundingBox;
        if (bbox) {
          width = Math.round(bbox.width);
          height = Math.round(bbox.height);
        }
      }

      if (previewUrl) return { previewUrl, width, height };
    }

    // No node-id (plain file link) — use the file's cover thumbnail, no dimensions.
    const fileRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}?depth=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!fileRes.ok) return null;

    const file = await fileRes.json();
    if (file.thumbnailUrl) return { previewUrl: file.thumbnailUrl, width: null, height: null };

    // Last resort: export the first page as PNG.
    const firstPageId = file.document?.children?.[0]?.id;
    if (!firstPageId) return null;

    const fallbackRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${firstPageId}&format=png&scale=1`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!fallbackRes.ok) return null;
    const fallbackData = await fallbackRes.json();
    const fallbackUrl = fallbackData.images?.[firstPageId] ?? null;
    return fallbackUrl ? { previewUrl: fallbackUrl, width: null, height: null } : null;
  } catch {
    return null;
  }
}
