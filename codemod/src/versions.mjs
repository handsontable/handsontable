import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { UsageError } from './errors.mjs';

/**
 * A parsed version. A partial input such as `17` or `17.1` keeps `parts` below 3 so callers can tell it
 * apart from a full version.
 *
 * @typedef {object} ParsedVersion
 * @property {number} major Major number.
 * @property {number} minor Minor number, `0` when the input had no minor part.
 * @property {number} patch Patch number, `0` when the input had no patch part.
 * @property {number} parts How many numeric parts the input had: 1, 2, or 3.
 * @property {string} prerelease Text after the first hyphen, or an empty string.
 */

const VERSION_PATTERN = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/;

/**
 * Parse `17`, `17.1`, `18.0.0`, or `18.0.0-rc.1`. A leading `v` is accepted.
 *
 * @param {string} input Version text.
 * @returns {ParsedVersion} The parsed version.
 * @throws {UsageError} When the text is not a version.
 */
export function parseVersion(input) {
  const match = VERSION_PATTERN.exec(String(input).trim());

  if (!match) {
    throw new UsageError(`"${input}" is not a version. Use a form like 17, 17.1, or 18.0.0.`);
  }

  const [, major, minor, patch, prerelease] = match;

  return {
    major: Number(major),
    minor: Number(minor ?? 0),
    patch: Number(patch ?? 0),
    parts: [major, minor, patch].filter(part => part !== undefined).length,
    prerelease: prerelease ?? '',
  };
}

/**
 * Compare two versions as semver does. A prerelease sorts below the same release. `Infinity` is allowed in
 * any numeric part so a partial input can stand for "the end of that line".
 *
 * @param {{major: number, minor: number, patch: number, prerelease?: string}} a Left version.
 * @param {{major: number, minor: number, patch: number, prerelease?: string}} b Right version.
 * @returns {number} Negative when `a < b`, zero when equal, positive when `a > b`.
 */
export function compareVersions(a, b) {
  for (const part of ['major', 'minor', 'patch']) {
    if (a[part] !== b[part]) {
      return a[part] < b[part] ? -1 : 1;
    }
  }

  const pa = a.prerelease ?? '';
  const pb = b.prerelease ?? '';

  if (pa === pb) {
    return 0;
  }

  if (pa === '') {
    return 1;
  }

  if (pb === '') {
    return -1;
  }

  return pa < pb ? -1 : 1;
}

/**
 * Format a parsed version back to text.
 *
 * @param {ParsedVersion} version Parsed version.
 * @returns {string} Text such as `18.0.0`.
 */
export function formatVersion(version) {
  const base = `${version.major}.${version.minor}.${version.patch}`;

  return version.prerelease ? `${base}-${version.prerelease}` : base;
}

/**
 * Resolve a `--from` value to the version the project is assumed to be on. A partial input stands for the
 * end of its line: `17` means "any 17.x", so every manifest above 17.x applies, and `18.0` means "any
 * 18.0.x".
 *
 * @param {string} input The `--from` text.
 * @returns {{major: number, minor: number, patch: number, prerelease: string}} Exclusive lower bound.
 */
export function resolveFrom(input) {
  const version = parseVersion(input);

  return {
    major: version.major,
    minor: version.parts >= 2 ? version.minor : Infinity,
    patch: version.parts >= 3 ? version.patch : Infinity,
    prerelease: version.parts >= 3 ? version.prerelease : '',
  };
}

/**
 * Resolve a `--to` value to the target version. A partial input resolves against the known manifest
 * versions: `18` means the highest known 18.x. When no manifest matches the prefix, it stands for the end
 * of that line, which selects nothing new.
 *
 * @param {string} input The `--to` text.
 * @param {string[]} knownVersions Versions that have a manifest.
 * @returns {{major: number, minor: number, patch: number, prerelease: string}} Inclusive upper bound.
 */
export function resolveTo(input, knownVersions) {
  const version = parseVersion(input);

  if (version.parts === 3) {
    return version;
  }

  const matching = knownVersions
    .map(parseVersion)
    .filter(known => known.major === version.major && (version.parts === 1 || known.minor === version.minor))
    .sort(compareVersions);

  if (matching.length > 0) {
    return matching[matching.length - 1];
  }

  return {
    major: version.major,
    minor: version.parts >= 2 ? version.minor : Infinity,
    patch: Infinity,
    prerelease: '',
  };
}

/**
 * Pick the manifests that run: `from < version <= to`, in ascending order. Drafts are left out unless
 * requested, and the left-out ones are returned so the caller can say so.
 *
 * @param {Array<{version: string, status: string}>} manifests All loaded manifests.
 * @param {object} range Range options.
 * @param {{major: number, minor: number, patch: number, prerelease?: string}|null} range.from Exclusive lower
 * bound, or `null` for no lower bound.
 * @param {{major: number, minor: number, patch: number, prerelease?: string}} range.to Inclusive upper bound.
 * @param {boolean} [range.includeDraft] Whether draft manifests may run.
 * @returns {{selected: object[], skippedDrafts: object[]}} The manifests to run and the drafts left out.
 */
export function selectManifests(manifests, { from, to, includeDraft = false }) {
  const inRange = manifests
    .filter((manifest) => {
      const version = parseVersion(manifest.version);

      return (from === null || compareVersions(version, from) > 0) && compareVersions(version, to) <= 0;
    })
    .sort((a, b) => compareVersions(parseVersion(a.version), parseVersion(b.version)));

  return {
    selected: inRange.filter(manifest => includeDraft || manifest.status !== 'draft'),
    skippedDrafts: includeDraft ? [] : inRange.filter(manifest => manifest.status === 'draft'),
  };
}

/**
 * Pick the default `--to`: the latest released manifest, or the latest manifest of any status when drafts
 * are allowed.
 *
 * @param {Array<{version: string, status: string}>} manifests All loaded manifests.
 * @param {boolean} includeDraft Whether draft manifests count.
 * @returns {string|null} The version text, or `null` when no manifest qualifies.
 */
export function defaultTo(manifests, includeDraft) {
  const candidates = manifests
    .filter(manifest => includeDraft || manifest.status === 'released')
    .sort((a, b) => compareVersions(parseVersion(a.version), parseVersion(b.version)));

  return candidates.length > 0 ? candidates[candidates.length - 1].version : null;
}

/**
 * Take the lowest version a dependency range allows: `^17.1.0` gives `17.1.0`, `17.x` gives `17`, and
 * `>=17 <19` gives `17`. A range that names no version (`latest`, `*`, `workspace:*`) gives `null`.
 *
 * @param {string} range A dependency range from package.json.
 * @returns {string|null} The minimum version text, or `null`.
 */
export function minimumOfRange(range) {
  const match = /(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(-[0-9A-Za-z.-]+)?/.exec(String(range));

  if (!match) {
    return null;
  }

  const parts = [match[1]];

  for (const part of [match[2], match[3]]) {
    if (part === undefined || /^[xX*]$/.test(part)) {
      break;
    }

    parts.push(part);
  }

  return parts.join('.') + (parts.length === 3 && match[4] ? match[4] : '');
}

/**
 * Detect the Handsontable version a project uses. The installed package wins, found by walking up from
 * `cwd`. The range in the nearest package.json is the fallback.
 *
 * @param {string} cwd Project directory.
 * @returns {Promise<{version: string, source: string}|null>} The version and where it came from, or `null`.
 */
export async function detectInstalledVersion(cwd) {
  let dir = cwd;

  for (;;) {
    const installed = await readJson(join(dir, 'node_modules', 'handsontable', 'package.json'));

    if (installed && typeof installed.version === 'string') {
      return { version: installed.version, source: 'node_modules/handsontable' };
    }

    const parent = dirname(dir);

    if (parent === dir) {
      break;
    }

    dir = parent;
  }

  const manifest = await readJson(join(cwd, 'package.json'));

  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const range = manifest?.[field]?.handsontable;
    const minimum = typeof range === 'string' ? minimumOfRange(range) : null;

    if (minimum) {
      return { version: minimum, source: `package.json ${field}` };
    }
  }

  return null;
}

/**
 * Read and parse a JSON file, treating a missing or unreadable file as absent.
 *
 * @param {string} path File path.
 * @returns {Promise<object|null>} The parsed value, or `null`.
 */
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    // A missing or malformed file only means this source cannot name a version.
    return null;
  }
}
