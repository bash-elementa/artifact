import { NextRequest, NextResponse } from "next/server";

// Mirror of buildSrcdoc in ReactRenderer.tsx — runs server-side so Microlink
// can screenshot a real rendered page instead of the raw JSX source file.
function buildSrcdoc(code: string): string {
  let processed = code;

  const reactHooks: string[] = [];
  processed = processed.replace(
    /^import\s+React(?:\s*,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?\s*$/gm,
    (_, named) => {
      if (named) reactHooks.push(...named.split(",").map((s: string) => s.trim()).filter(Boolean));
      return "";
    }
  );
  processed = processed.replace(
    /^import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*$/gm,
    (_, named) => {
      reactHooks.push(...named.split(",").map((s: string) => s.trim()).filter(Boolean));
      return "";
    }
  );
  processed = processed.replace(
    /^import\s+ReactDOM\s+from\s+['"]react-dom(?:\/client)?['"];?\s*$/gm,
    ""
  );

  let appName = "App";
  processed = processed.replace(
    /^export\s+default\s+function\s+(\w+)/gm,
    (_, name) => { appName = name; return `function ${name}`; }
  );
  processed = processed.replace(
    /^export\s+default\s+class\s+(\w+)/gm,
    (_, name) => { appName = name; return `class ${name}`; }
  );
  processed = processed.replace(
    /^export\s+default\s+(\w+)\s*;?\s*$/gm,
    (_, name) => { appName = name; return ""; }
  );
  processed = processed.replace(/^export\s+(function|const|class|let|var)\s+/gm, "$1 ");
  processed = processed.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, "");

  const uniqueHooks = [...new Set(reactHooks)].filter(Boolean);
  const hooksLine = uniqueHooks.length > 0
    ? `const { ${uniqueHooks.join(", ")} } = React;\n`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${hooksLine}${processed}

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(${appName}));
} catch (e) {
  document.getElementById('root').innerHTML =
    '<div style="padding:2rem;color:#ef4444;font-family:monospace">' +
    '<b>Render error:</b><br>' + e.message + '</div>';
}
  <\/script>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return new NextResponse("Failed to fetch source", { status: 502 });
    const code = await res.text();
    return new NextResponse(buildSrcdoc(code), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Error building render", { status: 500 });
  }
}
