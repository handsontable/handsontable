// Rewrites root-relative internal links/assets in a previously-built,
// frozen docs version so they keep working once that version's flat build
// output gets nested under /docs/<version>/ for production serving.
//
// Old (Astro, >=17.1) docs images are built with an unversioned base
// (`/docs`), so every internal `href="/docs/..."` / `src="/docs/..."`
// reference is root-relative with no version segment. build_current_version.sh
// copies that frozen build byte-for-byte into docs/docs/<version>/ for every
// deploy; without this rewrite, any link click (or asset load) on the nested
// old version resolves to the unversioned root -- i.e. whatever is currently
// deployed as latest -- instead of staying on that pinned version.
//
// Only rewrites the attribute-anchored form (`="/docs/`), so it can never
// match a fully-qualified URL such as
// `https://handsontable.com/docs/data/common.json` (no `="` immediately
// before `/docs/` in that string).
//
// The same unversioned base is baked into Vite's preload helper
// (`_astro/preload-helper.*.js`), which builds each lazily-loaded chunk's
// dependency URL as `function(l){return"/docs/"+l}`. Nested under
// /docs/<version>/, that fetches `/docs/_astro/<file>.css` (404) instead of
// `/docs/<version>/_astro/<file>.css` and throws "Unable to preload CSS"
// (DEV-3058, Sentry HANDSONTABLE-DOCS-22T). Only that exact minified
// function shape is rewritten, in `.js` files under `_astro/`.
//
// Usage: node rewriteVersionedPaths.mjs <dir> <version>

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches the minified Vite preload-helper base function,
 * `function(l){return"/docs/"+l}`. The parameter name is captured and
 * back-referenced so no other `"/docs/"` string can match.
 */
const PRELOAD_HELPER_BASE_PATTERN = /(function\(([\w$]+)\)\{return")\/docs\/("\+\2\})/g;

/**
 * Rewrites `href="/docs/..."` / `src="/docs/..."` references in every
 * `.html` file under `dir` to `href="/docs/<version>/..."`, skipping
 * references already prefixed with that version (idempotent). Also rewrites
 * the preload-helper base in every `.js` file under `_astro/` to
 * `"/docs/<version>/"`.
 *
 * @param {string} dir - Directory containing one version's built docs.
 * @param {string} version - e.g. "17.1".
 * @returns {Promise<number>} Number of files that were changed.
 */
export async function rewriteVersionedPaths(dir, version) {
  const pattern = new RegExp(
    `((?:href|src)=")\\/docs\\/(?!${escapeRegExp(version)}\\/)`,
    'g'
  );
  const replacement = `$1/docs/${version}/`;
  const preloadBaseReplacement = `$1/docs/${version}/$3`;

  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name));
  const htmlFiles = files.filter((file) => extname(file) === '.html');
  const astroJsFiles = files.filter(
    (file) => extname(file) === '.js' && relative(dir, file).split(sep).includes('_astro')
  );

  let changedCount = 0;

  for (const file of [...htmlFiles, ...astroJsFiles]) {
    const original = await readFile(file, 'utf-8');
    const rewritten = extname(file) === '.html'
      ? original.replace(pattern, replacement)
      : original.replace(PRELOAD_HELPER_BASE_PATTERN, preloadBaseReplacement);

    if (rewritten !== original) {
      await writeFile(file, rewritten, 'utf-8');
      changedCount += 1;
    }
  }

  return changedCount;
}

// process.argv[1] is not resolved to an absolute path when the script is
// invoked with a relative one (e.g. `node rewriteVersionedPaths.mjs ...`,
// as build_current_version.sh does), so comparing it to import.meta.url as
// a plain string would never match. pathToFileURL() resolves it the same
// way Node resolves import.meta.url, relative to the current working
// directory, so the comparison works regardless of how the script is invoked.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const [dir, version] = process.argv.slice(2);

  if (!dir || !version) {
    console.error('Usage: node rewriteVersionedPaths.mjs <dir> <version>');
    process.exitCode = 1;
  } else {
    const changedCount = await rewriteVersionedPaths(dir, version);

    console.log(`Rewrote version-prefixed links in ${changedCount} file(s) under ${dir} for version ${version}.`);
  }
}
