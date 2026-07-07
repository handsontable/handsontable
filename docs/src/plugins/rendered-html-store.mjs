/**
 * File-backed storage for loader-rendered page HTML (DEV-1991).
 *
 * The framework loader pre-renders every docs page to HTML (Starlight's route
 * renders `entry.rendered.html` directly, and Astro's Content Loader API has
 * no on-demand rendering contract). Persisting that HTML inside
 * `.astro/data-store.json` made the store grow to ~190 MB, and Astro's dev
 * server materializes the entire store in memory several times over on the
 * first page request — exceeding the default Node heap.
 *
 * Instead, the loader writes each entry's HTML to a file in
 * `.astro/rendered-html/` and stores only a marker comment
 * (`<!--hot-rendered:<entry id>-->`) as `entry.rendered.html`. The middleware
 * in `src/middleware.ts` swaps the marker for the file content in the
 * response — per request in dev, at prerender time in builds. Everything
 * else (`rendered.metadata`, headings, Starlight's routing) is unchanged.
 *
 * The directory lives next to `data-store.json` on purpose: both are derived
 * caches, rebuilt by a content sync, and wiped together by `rm -rf .astro`.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const RENDERED_HTML_DIR = join(docsRoot, '.astro', 'rendered-html');

let currentDir = RENDERED_HTML_DIR;

/**
 * Redirects reads and writes to another directory. Test-only — production
 * code always uses {@link RENDERED_HTML_DIR}.
 *
 * @param {string} dir
 */
export function setRenderedHtmlDirForTests(dir) {
  currentDir = dir;
  dirCreated = false;
}

/**
 * Matches the marker stored as `entry.rendered.html`, capturing the entry id.
 * Entry ids are permalink slugs with a framework prefix, e.g.
 * `react-data-grid/cell-type` — lowercase word characters, dots, dashes, and
 * slashes only.
 */
export const RENDERED_HTML_MARKER_RE = /<!--hot-rendered:([\w./-]+)-->/g;

let dirCreated = false;

/**
 * Converts an entry id to its backing file path. Slashes are flattened so the
 * directory stays a single level deep.
 *
 * @param {string} id – content entry id, e.g. `react-data-grid/cell-type`.
 * @param {string} [dir] – base directory; defaults to the module-relative
 *   {@link RENDERED_HTML_DIR}. `src/middleware.ts` passes the project-root
 *   derived path instead, because the middleware is bundled into `dist/`
 *   at build time, where `import.meta.url`-relative resolution breaks.
 * @returns {string}
 */
export function renderedHtmlPath(id, dir = currentDir) {
  return join(dir, `${id.replace(/\//g, '__')}.html`);
}

/**
 * Writes an entry's rendered HTML to its backing file and returns the marker
 * to store in the data store instead of the HTML.
 *
 * @param {string} id – content entry id.
 * @param {string} html – full rendered page HTML.
 * @returns {string} the marker comment for `entry.rendered.html`.
 */
export function writeRenderedHtml(id, html) {
  if (!dirCreated) {
    mkdirSync(currentDir, { recursive: true });
    dirCreated = true;
  }

  writeFileSync(renderedHtmlPath(id), html);

  return `<!--hot-rendered:${id}-->`;
}

/**
 * Reads an entry's rendered HTML back from its backing file.
 *
 * @param {string} id – content entry id.
 * @param {string} [dir] – base directory override, see {@link renderedHtmlPath}.
 * @returns {string|null} the HTML, or `null` when the file is missing (e.g.
 *   a partially wiped `.astro/` directory).
 */
export function readRenderedHtml(id, dir = currentDir) {
  try {
    return readFileSync(renderedHtmlPath(id, dir), 'utf8');
  } catch {
    return null;
  }
}
