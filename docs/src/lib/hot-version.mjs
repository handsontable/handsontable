import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the current Handsontable core version from `handsontable/package.json`.
 *
 * Takes the docs package root as an explicit argument instead of deriving it
 * from this module's own `import.meta.url`. The caller (`astro.config.mjs`)
 * runs directly under Node and is never bundled, so its own `__dirname` stays
 * stable -- unlike `.astro` component frontmatter, which Vite relocates
 * during the production build, silently breaking any self-relative path.
 *
 * @param {string} docsRootDir - Absolute path to the `docs/` package root.
 * @returns {string} The version string (e.g. "17.1.0"), or '' if unreadable.
 */
export function resolveHotVersion(docsRootDir) {
  try {
    const pkgPath = join(docsRootDir, '..', 'handsontable', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    return pkg.version ?? '';
  } catch {
    return '';
  }
}
