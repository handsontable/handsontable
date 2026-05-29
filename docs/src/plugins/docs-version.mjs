/**
 * Computes the Handsontable version string to embed in documentation pages.
 *
 * - Production (BUILD_MODE=production): reads the version from
 *   handsontable/package.json (e.g. "17.0.1").
 * - Staging/dev: derives a pre-release version from the current git commit
 *   in the format "0.0.0-next-{shortSHA}-{YYYYMMDD}" so that CodeSandbox
 *   links on the Introduction page resolve to the correct in-progress build.
 *   When GITHUB_SHA is set (CI environment) it is preferred over `git rev-parse`
 *   to avoid requiring a git binary at build time.
 */

import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const _require = createRequire(import.meta.url);
const _dir = dirname(fileURLToPath(import.meta.url));

/**
 * Returns the 7-character short SHA for the current HEAD commit.
 * Prefers the GITHUB_SHA environment variable (available in GitHub Actions)
 * and falls back to `git rev-parse --short HEAD`. Returns 'dev' when neither
 * is available.
 *
 * @returns {string}
 */
function getShortSha() {
  const envSha = process.env.GITHUB_SHA;

  if (envSha && envSha.length >= 7) {
    return envSha.slice(0, 7);
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().slice(0, 7);
  } catch {
    return 'dev';
  }
}

/**
 * Returns the commit date for HEAD in YYYYMMDD format.
 * Falls back to the current wall-clock date when git is unavailable.
 *
 * @returns {string}
 */
function getCommitDate() {
  try {
    return execSync('git log -1 --format=%cd --date=format:%Y%m%d', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
  }
}

/**
 * Computes the version string used in docs page links (e.g. CodeSandbox URLs).
 *
 * @returns {string}
 */
function computeDocsVersion() {
  if (process.env.BUILD_MODE === 'production') {
    try {
      const pkg = _require(join(_dir, '../../../handsontable/package.json'));

      return pkg.version ?? 'next';
    } catch {
      return 'next';
    }
  }

  // Staging / dev: 0.0.0-next-{shortSHA}-{YYYYMMDD}
  const shortSha = getShortSha();
  const date = getCommitDate();

  return `0.0.0-next-${shortSha}-${date}`;
}

/**
 * The resolved Handsontable version for this docs build.
 * Evaluated once at module load time so all imports share the same value.
 *
 * @type {string}
 */
export const CURRENT_DOCS_VERSION = computeDocsVersion();

/**
 * The major.minor version used for prod-docs GitHub branch links.
 *
 * Production builds strip the patch segment from CURRENT_DOCS_VERSION
 * (e.g. "17.1.0" → "17.1") to match the prod-docs/X.Y branch naming convention.
 * Non-production builds fall back to "develop" so the links point to the
 * always-current develop branch.
 *
 * @type {string}
 */
export const CURRENT_DOCS_MINOR_VERSION = (() => {
  if (process.env.BUILD_MODE === 'production') {
    const match = CURRENT_DOCS_VERSION.match(/^(\d+\.\d+)/);

    return match ? match[1] : CURRENT_DOCS_VERSION;
  }

  return 'develop';
})();
