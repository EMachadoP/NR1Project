function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function reportDocument(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f9ff;
        --paper: #ffffff;
        --ink: #181c20;
        --muted: #56657b;
        --accent: #003d7c;
        --line: #dfe3e8;
        --critical: #8f3c00;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, Arial, sans-serif;
        padding: 32px;
      }
      .report {
        max-width: 980px;
        margin: 0 auto;
        background: var(--paper);
        border-radius: 24px;
        padding: 40px;
      }
      h1, h2, h3 { font-family: "Public Sans", Arial, sans-serif; margin: 0; }
      h1 { font-size: 34px; line-height: 1.1; color: var(--accent); }
      h2 { font-size: 22px; margin-top: 32px; }
      h3 { font-size: 16px; margin-top: 20px; }
      p { line-height: 1.7; }
      .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--muted); font-weight: 700; }
      .muted { color: var(--muted); }
      .grid { display: grid; gap: 16px; }
      .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .card { background: #f8fafe; border-radius: 18px; padding: 20px; }
      .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #e8eefb; color: var(--accent); font-size: 12px; font-weight: 700; }
      .critical { background: #ffdbcb; color: var(--critical); }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
      th { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      ul { padding-left: 20px; }
      .footer { margin-top: 28px; font-size: 12px; color: var(--muted); }
    </style>
  </head>
  <body>
    <div class="report">${body}</div>
  </body>
</html>`;
}
