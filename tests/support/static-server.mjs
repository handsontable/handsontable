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
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 8123;
// cwd is `tests/` when launched by Playwright; serve one level up (repo root).
const ROOT = path.resolve(process.cwd(), '..');

// Preflight: the formulas fixture serves the engine from this package's own
// node_modules. When it is missing (an install that predates this package, or
// a filtered one), say so actionably at startup instead of a bare 404 mid-run.
if (!existsSync(path.join(ROOT, 'tests/node_modules/hyperformula/dist/hyperformula.full.min.js'))) {
  // eslint-disable-next-line no-console
  console.error('static-server: tests/node_modules/hyperformula is missing — formulas fixtures will 404. '
    + 'Run `pnpm install` from the repo root (see tests/README.md).');
}

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
    // Resolve within ROOT and refuse path traversal. The separator suffix makes
    // the boundary exact — a bare startsWith(ROOT) would also admit siblings
    // like `${ROOT}-other/…`.
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    // CI parity: the CI job installs only the filtered handsontable-tests
    // workspace, so no other package's node_modules exists there. Refuse them
    // here too (404, exactly what CI produces) — a fixture referencing e.g.
    // /handsontable/node_modules/… must fail locally the same way it fails in
    // CI, instead of passing against the full local workspace install.
    // Fixture-served libraries belong in THIS package (see tests/AGENTS.md).
    const segments = path.relative(ROOT, filePath).split(path.sep);
    if (segments.includes('node_modules') && !(segments[0] === 'tests' && segments[1] === 'node_modules')) {
      res.writeHead(404).end('Not found (node_modules outside tests/ are not served — CI parity)');
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
