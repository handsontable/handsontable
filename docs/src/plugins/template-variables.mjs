/**
 * Substitutes the VuePress-style template variables used in documentation
 * markdown.
 *
 * Two separate pipelines render page markdown - the Astro content-layer loader
 * (`framework-loader.mjs`) and the Vite pre-transform (`vuepress-preprocessor.mjs`) -
 * and the `_md` route generator in `astro.config.mjs` writes a third,
 * plain-markdown output. A variable resolved in only one of them silently
 * survives as a literal `{{$name}}` in the others, so the regexes live here
 * rather than being copied per call site.
 *
 * Supported variables:
 *
 * - `{{$basePath}}` - the VuePress versioned-base prefix. Astro resolves public
 *   assets relative to the site root, so page markdown drops it entirely and the
 *   root-relative path (e.g. `/img/pages/...`) stays correct. Embedded example
 *   source files need `/docs` instead, which is why `basePath` is an option.
 * - `{{$currentVersion}}` - the resolved Handsontable version string. Production
 *   builds use the `handsontable/package.json` version (e.g. `18.0.2`);
 *   staging/dev builds use `0.0.0-next-<shortSHA>-<YYYYMMDD>` so runner links
 *   resolve to the in-progress build artifact.
 * - `{{$currentMinorVersion}}` - the `handsontable/handsontable` branch for
 *   source-code links: `prod-docs/<major>.<minor>` in production, `develop`
 *   otherwise.
 * - `{{$examplesBranch}}` - the `handsontable/examples` branch for starter
 *   source links: `prod-examples/<major>` in production, `master` otherwise.
 * - `{{$latestChangelogVersion}}` - the highest existing `changelog-N` major, so
 *   a "Changelog" link stays current without a manual edit every major release.
 *   Callers that resolve `@/...md` links must substitute before doing so, or the
 *   link lands on a page that does not exist.
 * - `{{$a11y.<key>}}` - a value rendered from the accessibility data file
 *   (`content/data/accessibility.json`): the target wording, the conformance
 *   report's version and date, the tested screen readers, the known limitations.
 *   The keys are the ones `accessibilityTemplateValues()` in
 *   `accessibility-data.mjs` returns; an unknown key throws, so a typo fails the
 *   build instead of printing a placeholder. A value may hold Markdown (a list, a
 *   table, an `@/...md` link), which is why this runs before the link resolution
 *   too. The values are re-read when the data file's modification time changes, so
 *   the dev server picks up an edit on the next page render. Shape and consumers:
 *   `docs/AGENTS.md`, section 2.20.
 */

import { statSync } from 'node:fs';
import {
  CURRENT_DOCS_VERSION,
  CURRENT_DOCS_MINOR_VERSION,
  CURRENT_EXAMPLES_BRANCH,
} from './docs-version.mjs';
import { LATEST_CHANGELOG_MAJOR } from './changelog-parser.mjs';
import {
  ACCESSIBILITY_DATA_FILE,
  accessibilityTemplateValues,
  loadAccessibilityData,
} from './accessibility-data.mjs';

/**
 * The rendered values per data file, with the modification time they were read at.
 *
 * @type {Map<string, {mtimeMs: number, values: Record<string, string>}>}
 */
const a11yValuesCache = new Map();

/**
 * The `{{$a11y.<key>}}` values rendered from an accessibility data file. They are cached until the
 * file's modification time changes, so `docs:dev` picks up an edit to the data file on the next
 * page render instead of after a restart, and a build reads the file once.
 *
 * @param {string} [file] The data file; defaults to the committed one.
 * @returns {Record<string, string>} The values.
 */
export function readAccessibilityTemplateValues(file = ACCESSIBILITY_DATA_FILE) {
  const { mtimeMs } = statSync(file);
  const cached = a11yValuesCache.get(file);

  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.values;
  }

  const values = accessibilityTemplateValues(loadAccessibilityData(file));

  a11yValuesCache.set(file, { mtimeMs, values });

  return values;
}

/**
 * Replaces every supported `{{$name}}` template variable in a string.
 *
 * The values default to the constants resolved for this build; pass them
 * explicitly to test both the production and the development mapping without
 * reloading `docs-version.mjs` (its constants are computed once at module load).
 *
 * @param {string} text The markdown or source text to transform.
 * @param {object} [options]
 * @param {string} [options.basePath] Replacement for `{{$basePath}}`.
 * @param {string} [options.version] Replacement for `{{$currentVersion}}`.
 * @param {string} [options.minorVersion] Replacement for `{{$currentMinorVersion}}`.
 * @param {string} [options.examplesBranch] Replacement for `{{$examplesBranch}}`.
 * @param {string|number} [options.latestChangelogVersion] Replacement for
 *   `{{$latestChangelogVersion}}`.
 * @param {Record<string, string>} [options.a11y] The `{{$a11y.<key>}}` values;
 *   defaults to the ones rendered from the accessibility data file.
 * @returns {string}
 */
export function replaceTemplateVariables(text, {
  basePath = '',
  version = CURRENT_DOCS_VERSION,
  minorVersion = CURRENT_DOCS_MINOR_VERSION,
  examplesBranch = CURRENT_EXAMPLES_BRANCH,
  latestChangelogVersion = LATEST_CHANGELOG_MAJOR,
  a11y = null,
} = {}) {
  let a11yValues = a11y;

  // The replacements are passed as functions so a `$` in a value (`$&`, `$1`)
  // cannot be read as a replacement pattern.
  return text
    .replace(/\{\{\s*\$a11y\.([\w.]+)\s*\}\}/g, (placeholder, key) => {
      // Read once per call, and only for text that uses a variable: one `stat` per page.
      a11yValues ??= readAccessibilityTemplateValues();

      if (!Object.hasOwn(a11yValues, key)) {
        throw new Error(`Unknown template variable ${placeholder}: accessibility-data.mjs provides ` +
          `${Object.keys(a11yValues).join(', ')} (see docs/AGENTS.md, section 2.20)`);
      }

      return a11yValues[key];
    })
    .replace(/\{\{\s*\$basePath\s*\}\}/g, () => basePath)
    .replace(/\{\{\s*\$currentVersion\s*\}\}/g, () => version)
    .replace(/\{\{\s*\$currentMinorVersion\s*\}\}/g, () => minorVersion)
    .replace(/\{\{\s*\$examplesBranch\s*\}\}/g, () => examplesBranch)
    .replace(/\{\{\s*\$latestChangelogVersion\s*\}\}/g, () => String(latestChangelogVersion));
}
