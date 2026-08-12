/**
 * Green-run cache for the local E2E hooks — agent-agnostic run-once semantics.
 *
 * The Stop hook (Claude, turn end) and the pre-push hook (everyone) both run the
 * touched Playwright specs. Without coordination a spec proven green at Stop is
 * re-proven at push (and on every subsequent push). This cache records a green
 * run keyed by CONTENT — the spec file plus the environment it ran against (the
 * built dist bundle + the shared fixtures/pages) — so an unchanged spec against
 * an unchanged environment is skipped, no matter which tool ran it first.
 *
 * Invalidation is automatic: editing the spec, rebuilding the dist, or touching
 * a fixture changes the key → the spec runs again. CI remains authoritative and
 * always runs the full project on the PR.
 *
 * The cache lives in `.git/` — per-clone, never committed, survives tmpdir
 * cleanups, and vanishes with the clone.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const CACHE_FILE = 'hot-e2e-green.json';
const MAX_ENTRIES = 200;

/**
 * SHA-256 of a file's bytes ('' when unreadable).
 *
 * @param {string} p Absolute file path.
 * @returns {string} Hex digest, or '' on failure.
 */
function fileHash(p) {
  try {
    return createHash('sha256').update(readFileSync(p)).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Recursively list files under a directory (sorted, absolute).
 *
 * @param {string} dir Absolute directory path.
 * @returns {string[]} Absolute file paths (empty when the dir is missing).
 */
function listFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(e => e.isFile())
    .map(e => path.join(e.parentPath ?? e.path, e.name))
    .sort();
}

/**
 * Hash of the environment a spec runs against: BOTH dist bundles the fixtures
 * can load (`?bundle=` umd → `handsontable.js`, full-min →
 * `handsontable.full.min.js`) + the theme stylesheets they also load (the
 * fixtures pull `handsontable.min.css` + `ht-theme-<theme>.min.css` per the
 * ?theme= project) + every file under tests/fixtures (page objects, demo
 * pages) + the Playwright config. Hashing only one bundle would let a rebuild
 * of the other slip through as "environment unchanged", and the pre-push hook
 * would skip specs as already-green against a bundle they never ran on. ''
 * when either bundle is absent (never skip then).
 *
 * @param {string} root Repo root.
 * @returns {string} Hex digest, or '' when the environment is incomplete.
 */
export function envHash(root) {
  const bundles = [
    'handsontable/dist/handsontable.js',
    'handsontable/dist/handsontable.full.min.js',
  ].map(rel => fileHash(path.join(root, rel)));

  if (bundles.some(bundle => !bundle)) {
    return '';
  }
  const h = createHash('sha256');

  bundles.forEach(bundle => h.update(bundle));

  // Theme CSS the demo fixtures load — a styles-only rebuild must invalidate the
  // cache (the per-theme render depends on it), even though the JS is unchanged.
  for (const css of ['handsontable', 'ht-theme-main', 'ht-theme-horizon', 'ht-theme-classic']) {
    h.update(fileHash(path.join(root, `handsontable/styles/${css}.min.css`)));
  }

  for (const f of listFiles(path.join(root, 'tests/fixtures'))) {
    h.update(f).update(fileHash(f));
  }
  h.update(fileHash(path.join(root, 'tests/playwright.config.ts')));

  return h.digest('hex');
}

/**
 * Cache key for one spec in one environment.
 *
 * @param {string} root Repo root.
 * @param {string} spec Spec path relative to `tests/` (e.g. `e2e/grid.spec.ts`).
 * @param {string} env Result of `envHash(root)`.
 * @returns {string} The composed key, or '' when the spec is unreadable.
 */
export function specKey(root, spec, env) {
  const sh = fileHash(path.join(root, 'tests', spec));

  return sh && env ? `${spec}#${sh.slice(0, 16)}#${env.slice(0, 16)}` : '';
}

/**
 * Read the cache ({ keys: string[] }).
 *
 * @param {string} root Repo root.
 * @returns {Set<string>} Recorded green keys.
 */
function readCache(root) {
  try {
    return new Set(JSON.parse(readFileSync(path.join(root, '.git', CACHE_FILE), 'utf8')).keys);
  } catch {
    return new Set();
  }
}

/**
 * Split specs into { toRun, skipped } based on recorded green runs.
 *
 * @param {string} root Repo root.
 * @param {string[]} specs Spec paths relative to `tests/`.
 * @returns {{ toRun: string[], skipped: string[] }} Partitioned specs.
 */
export function filterCached(root, specs) {
  const env = envHash(root);
  const cache = readCache(root);
  const toRun = [];
  const skipped = [];

  for (const s of specs) {
    const key = specKey(root, s, env);

    (key && cache.has(key) ? skipped : toRun).push(s);
  }

  return { toRun, skipped };
}

/**
 * Record specs as green for the current content/environment. Best-effort.
 *
 * @param {string} root Repo root.
 * @param {string[]} specs Spec paths relative to `tests/` that just passed.
 * @returns {void}
 */
export function recordGreen(root, specs) {
  const env = envHash(root);

  if (!env) {
    return;
  }
  const keys = new Set(readCache(root));

  for (const s of specs) {
    const key = specKey(root, s, env);

    if (key) {
      keys.add(key);
    }
  }

  try {
    writeFileSync(
      path.join(root, '.git', CACHE_FILE),
      JSON.stringify({ keys: [...keys].slice(-MAX_ENTRIES) }),
    );
  } catch { /* cache is an optimization — never fail the hook over it */ }
}
