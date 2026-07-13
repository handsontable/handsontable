/**
 * Minimal static file server for the Playwright fixtures. Serves the repo root
 * so a fixture page can reference the built `handsontable/dist` and
 * `handsontable/styles` assets. Started by the Playwright `webServer` config.
 *
 * Intentionally dependency-free (node: built-ins only) per the repo's
 * minimal-dependency and air-gap constraints.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 8123;
// cwd is `tests/` when launched by Playwright; serve one level up (repo root).
const ROOT = path.resolve(process.cwd(), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // Resolve within ROOT and refuse path traversal.
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`static-server: serving ${ROOT} on http://localhost:${PORT}`);
});
