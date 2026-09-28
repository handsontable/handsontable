/**
 * Target-branch resolution for the docs sync.
 *
 * Production docs are served from the highest `prod-docs/<major>.<minor>`
 * branch. `prod-docs/latest` is a stale branch nothing deploys from
 * (`docs-production.yml` excludes it), so it never qualifies.
 */

const PROD_DOCS = /^prod-docs\/(\d+)\.(\d+)$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)/;

/**
 * Pick the highest `prod-docs/<major>.<minor>` branch.
 *
 * @param {string[]} branchNames Branch names without the `origin/` prefix.
 * @returns {string|null} The branch name, or null when none matches.
 */
export function pickTarget(branchNames) {
  const parsed = branchNames
    .map((name) => {
      const match = PROD_DOCS.exec(name.trim());

      return match ? { name: match[0], major: Number(match[1]), minor: Number(match[2]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.major - b.major || a.minor - b.minor);

  return parsed.length > 0 ? parsed[parsed.length - 1].name : null;
}

/**
 * Parse the leading `major.minor.patch` of a version string.
 *
 * @param {string} text A version such as `18.1.0` or `18.1.0-rc3`.
 * @returns {{ major: number, minor: number, patch: number }}
 */
export function parseVersion(text) {
  const match = SEMVER.exec(String(text).trim());

  if (!match) {
    throw new Error(`Unparseable version: ${text}`);
  }

  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/**
 * Compare two versions by `major.minor` only.
 *
 * @param {{ major: number, minor: number }} a
 * @param {{ major: number, minor: number }} b
 * @returns {number} Negative, zero, or positive like a sort comparator.
 */
export function compareMinor(a, b) {
  return Math.sign((a.major - b.major) || (a.minor - b.minor));
}

/**
 * The bot-owned branch that carries the sync for one target.
 *
 * @param {string} target A `prod-docs/<major>.<minor>` branch name.
 * @returns {string}
 */
export function syncBranchFor(target) {
  return `docs-sync/${target.replace(/\//g, '-')}`;
}
