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
 */

import {
  CURRENT_DOCS_VERSION,
  CURRENT_DOCS_MINOR_VERSION,
  CURRENT_EXAMPLES_BRANCH,
} from './docs-version.mjs';
import { LATEST_CHANGELOG_MAJOR } from './changelog-parser.mjs';

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
 * @returns {string}
 */
export function replaceTemplateVariables(text, {
  basePath = '',
  version = CURRENT_DOCS_VERSION,
  minorVersion = CURRENT_DOCS_MINOR_VERSION,
  examplesBranch = CURRENT_EXAMPLES_BRANCH,
  latestChangelogVersion = LATEST_CHANGELOG_MAJOR,
} = {}) {
  // The replacements are passed as functions so a `$` in a value (`$&`, `$1`)
  // cannot be read as a replacement pattern.
  return text
    .replace(/\{\{\s*\$basePath\s*\}\}/g, () => basePath)
    .replace(/\{\{\s*\$currentVersion\s*\}\}/g, () => version)
    .replace(/\{\{\s*\$currentMinorVersion\s*\}\}/g, () => minorVersion)
    .replace(/\{\{\s*\$examplesBranch\s*\}\}/g, () => examplesBranch)
    .replace(/\{\{\s*\$latestChangelogVersion\s*\}\}/g, () => String(latestChangelogVersion));
}
