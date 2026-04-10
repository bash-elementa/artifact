import { NextRequest, NextResponse } from "next/server";

const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "set-cookie",
  "content-encoding", // we decode the body
  "content-length",   // body length changes after injection
  "transfer-encoding",
]);

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
];

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Validate URL
  let target: URL;
  try {
    target = new URL(rawUrl);
    if (!["http:", "https:"].includes(target.protocol)) throw new Error("bad protocol");
    if (BLOCKED_HOST_PATTERNS.some((p) => p.test(target.hostname))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });

    // Build outbound headers — strip framing/security restrictions
    const outHeaders = new Headers();
    for (const [k, v] of upstream.headers.entries()) {
      if (!STRIP_HEADERS.has(k.toLowerCase())) outHeaders.set(k, v);
    }

    const ct = upstream.headers.get("content-type") ?? "";

    // Non-HTML resources — pass through unchanged (CSS, fonts, images, etc.)
    if (!ct.includes("text/html")) {
      return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
    }

    const html = await upstream.text();

    // Base href: resolves all relative URLs against the real origin
    const basePath = target.pathname.endsWith("/")
      ? target.pathname
      : target.pathname.replace(/\/[^/]*$/, "/");
    const baseHref = `${target.origin}${basePath}`;

    // Injected scripts — run before page scripts so they win
    const injection = [
      // 1. Anti-frame-bust: neutralise "if (top !== self) top.location = ..." checks
      `<script>try{Object.defineProperty(window,'top',{get:function(){return window;},configurable:true});}catch(e){}</script>`,

      // 2. Base href — all relative URLs resolve against original origin
      `<base href="${baseHref}">`,

      // 3. Link interception — same-origin navigation stays inside the proxy
      `<script>(function(){var P='/api/proxy?url=',O=${JSON.stringify(target.origin)};document.addEventListener('click',function(e){var a=e.target;while(a&&a.tagName!=='A')a=a.parentElement;if(!a||a.target==='_blank')return;var h=a.href;if(h&&(h.startsWith(O+'/')||h===O)){e.preventDefault();window.location.href=P+encodeURIComponent(h);}},true);})();</script>`,
    ].join("\n");

    // Inject right after the opening <head> tag (or prepend if no head)
    let patched: string;
    const headMatch = html.match(/<head[^>]*>/i);
    if (headMatch?.index !== undefined) {
      const idx = headMatch.index + headMatch[0].length;
      patched = html.slice(0, idx) + "\n" + injection + html.slice(idx);
    } else {
      patched = injection + html;
    }

    outHeaders.set("Content-Type", "text/html; charset=utf-8");
    return new NextResponse(patched, { status: upstream.status, headers: outHeaders });
  } catch (err) {
    console.error("[proxy]", err);
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
  }
}
