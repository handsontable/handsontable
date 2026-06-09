#!/usr/bin/env node

// Generates an index.html for the develop/ performance reports directory.
// Lists all timestamped run directories with links to their reports.
//
// Usage: node build-history-index.mjs <develop-dir-on-gh-pages>

import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const developDir = process.argv[2];

if (!developDir) {
  console.error('Usage: node build-history-index.mjs <develop-dir>');
  process.exit(1);
}

const entries = await readdir(developDir, { withFileTypes: true });

// Collect timestamped directories (format: YYYY-MM-DDTHH-MM-SSZ)
const runs = entries
  .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(e.name))
  .map(e => e.name)
  .sort()
  .reverse(); // newest first

const rows = runs.map((name) => {
  // Parse timestamp back to readable format
  // 2026-04-08T10-15-30Z → 2026-04-08 10:15:30 UTC
  const readable = name
    .replace('Z', '')
    .replace('T', ' ')
    .replace(/ (\d{2})-(\d{2})-(\d{2})$/, ' $1:$2:$3 UTC');

  return `      <tr>
        <td><a href="${name}/">${readable}</a></td>
        <td><a href="${name}/snapshots.json">JSON</a></td>
      </tr>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Performance History -- develop</title>
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
  color: #1f2328;
}
h1 { font-size: 22px; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th { text-align: left; padding: 8px; border-bottom: 2px solid #d0d7de;
  font-size: 12px; text-transform: uppercase; color: #656d76; }
td { padding: 8px; border-bottom: 1px solid #eaeef2; }
a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }
.count { color: #656d76; font-size: 14px; }
</style>
</head>
<body>
<h1>Performance History -- develop</h1>
<p class="count">${runs.length} run${runs.length !== 1 ? 's' : ''}</p>
<table>
  <thead>
    <tr><th>Run</th><th>Data</th></tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</body>
</html>`;

await writeFile(join(developDir, 'index.html'), html, 'utf8');

console.log(
  `History index written with ${runs.length} entries`
);
