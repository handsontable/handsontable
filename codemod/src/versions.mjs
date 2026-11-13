import { stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { UsageError } from './errors.mjs';
import { aliasRange, isSourceSpec, rangeAdmits } from './lib/dependency-range.mjs';
import { redact } from './lib/redact.mjs';
import { readUtf8, stripBom } from './lib/text-file.mjs';

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
    throw new UsageError(`"${redact(input)}" is not a version. Use a form like 17, 17.1, or 18.0.0.`);
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
 * The migration guides that came before the first manifest, as `[from, to]` pairs. The tool has no manifest for
 * them, so a project below the oldest covered version is pointed at these pages. Each guide lives at
 * `migration-from-<from>-to-<to>` next to the guides the manifests name.
 */
export const EARLIER_GUIDES = [
  ['7.4', '8.0'],
  ['8.4', '9.0'],
  ['9.0', '10.0'],
  ['10.0', '11.0'],
  ['11.1', '12.0'],
  ['12.4', '13.0'],
  ['13.1', '14.0'],
  ['14.6', '15.0'],
  ['15.3', '16.0'],
  ['16.0', '16.1'],
  ['16.2', '17.0'],
];

/**
 * The oldest version the manifests cover: the lowest `from` of all of them, read as the start of its line.
 *
 * @param {Array<{from: string}>} manifests All loaded manifests.
 * @returns {{major: number, minor: number, patch: number, prerelease: string, text: string}|null} The version,
 * with the text the manifest wrote (`17`), or `null` without manifests.
 */
export function oldestCovered(manifests) {
  const starts = manifests.map((manifest) => {
    const { major, minor, patch } = parseVersion(manifest.from);

    return { major, minor, patch, prerelease: '', text: manifest.from };
  }).sort(compareVersions);

  return starts[0] ?? null;
}

/**
 * The earlier migration steps a project still has to take by hand: the guides whose target is above the project
 * version and not above the oldest covered version.
 *
 * @param {{major: number, minor: number, patch: number, prerelease?: string}} from The project version, as
 * `resolveFrom` gives it.
 * @param {{major: number, minor: number, patch: number}} oldest The oldest covered version.
 * @param {string} guideBase URL up to and including the last slash of a manifest's guide URL.
 * @returns {Array<{from: string, to: string, url: string}>} The steps in order.
 */
export function uncoveredSteps(from, oldest, guideBase) {
  return EARLIER_GUIDES
    .filter(([, to]) => compareVersions(parseVersion(to), from) > 0 && compareVersions(parseVersion(to), oldest) <= 0)
    .map(([start, to]) => ({ from: start, to, url: `${guideBase}migration-from-${start}-to-${to}` }));
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
 * `>=17 <19` gives `17`, and an `npm:handsontable@^17.1.0` alias gives the minimum of the range it names. A spec
 * that names no version (`latest`, `*`) gives `null`, and so does a spec that points at a source (`workspace:`,
 * `file:`, `link:`, a path, a URL, a repository, `catalog:`), because the digits in it belong to a file name or a tag.
 *
 * @param {string} range A dependency range from package.json.
 * @returns {string|null} The minimum version text, or `null`.
 */
export function minimumOfRange(range) {
  const text = String(range).trim();

  if (text.startsWith('npm:')) {
    const named = aliasRange(text);

    return named === null ? null : minimumOfRange(named);
  }

  if (isSourceSpec(text)) {
    return null;
  }

  const match = /(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(-[0-9A-Za-z.-]+)?/.exec(text);

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
 * Tell whether a dependency range sits below the version a run starts from: its lowest version is on an earlier
 * major or minor line, and it does not admit the `--from` version. `~17.1.0` is below `--from 18.0`, while `^17.0.0`
 * is not below `--from 17.1` (it admits 17.1.0) and `^18.0.0` is not below `--from 18.0`. A range of a form the
 * tool does not understand is never below.
 *
 * @param {string} range A dependency range from package.json.
 * @param {string|undefined} fromText The `--from` text of the run.
 * @returns {string|null} The line of the range (`17.1`) when it is below `fromText`, else `null`.
 */
export function lineBelowFrom(range, fromText) {
  const minimum = minimumOfRange(range);

  if (!minimum || !fromText) {
    return null;
  }

  const found = parseVersion(minimum);
  const from = parseVersion(fromText);
  const earlier = found.major < from.major
    || (found.major === from.major && found.parts >= 2 && from.parts >= 2 && found.minor < from.minor);

  const fromVersion = `${from.major}.${from.parts >= 2 ? from.minor : 0}.${from.parts >= 3 ? from.patch : 0}`;

  if (!earlier || rangeAdmits(range, fromVersion) !== false) {
    return null;
  }

  return found.parts >= 2 ? `${found.major}.${found.minor}` : String(found.major);
}

/**
 * Detect the Handsontable version a project uses. The installed package wins, found by walking up from
 * `start`. The range in the nearest package.json, from `start` up to `stopAt`, is the fallback.
 *
 * @param {string} start Directory to start from, usually the project directory.
 * @param {object} [options] Options.
 * @param {string} [options.stopAt] The highest directory whose package.json counts. Defaults to `start`.
 * @returns {Promise<{version: string|null, source: string, range?: string}|null>} The version and where it came
 * from, or `null`. A `handsontable` range that names no version (`latest`) gives `version: null` with the `range`.
 */
export async function detectInstalledVersion(start, { stopAt = start } = {}) {
  let dir = start;

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

  let unversioned = null;

  for (dir = start; ; dir = dirname(dir)) {
    const manifest = await readJson(join(dir, 'package.json'));

    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const range = manifest?.[field]?.handsontable;
      const minimum = typeof range === 'string' ? minimumOfRange(range) : null;
      const where = relative(stopAt, dir).split(sep).join('/');
      const source = `${where ? `${where}/` : ''}package.json ${field}`;

      if (minimum) {
        return { version: minimum, source };
      }

      if (typeof range === 'string' && !unversioned) {
        unversioned = { version: null, range, source };
      }
    }

    if (dir === stopAt || dirname(dir) === dir) {
      return unversioned;
    }
  }
}

/**
 * Detect the version for a run. Each path argument is searched on its own, from its directory up to `cwd`, so
 * `migrate packages/a` from a monorepo root finds the package of `packages/a`. With no path, `cwd` is searched.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} [paths] Path arguments relative to `cwd`.
 * @returns {Promise<{version: string|null, source: string, sources?: string[], range?: string}|null>} The version and
 * where it came from, or `null`. `sources` lists where each path argument found it. See `detectInstalledVersion` for
 * `version: null`.
 * @throws {UsageError} When the paths resolve to different versions.
 */
export async function detectProjectVersion(cwd, paths = []) {
  const found = [];

  for (const path of paths.length > 0 ? paths : ['.']) {
    const absolute = resolve(cwd, path);
    const info = await stat(absolute).catch(() => null);
    const detected = await detectInstalledVersion(info?.isFile() ? dirname(absolute) : absolute, { stopAt: cwd });

    if (detected) {
      found.push({ path, ...detected });
    }
  }

  const versioned = found.filter(item => item.version !== null);

  if (new Set(versioned.map(item => item.version)).size > 1) {
    const list = versioned.map(item => `${item.path}: ${item.version}`).join(', ');

    throw new UsageError(`The paths use different Handsontable versions (${list}). `
      + 'Pass --from to say which one to migrate from, or run each path on its own.');
  }

  return versioned[0] ? { ...versioned[0], sources: versioned.map(item => item.source) } : (found[0] ?? null);
}

/**
 * Read and parse a JSON file, treating a missing or unreadable file as absent.
 *
 * @param {string} path File path.
 * @returns {Promise<object|null>} The parsed value, or `null`.
 */
async function readJson(path) {
  try {
    return JSON.parse(stripBom(await readUtf8(path)));
  } catch {
    // A missing or malformed file only means this source cannot name a version.
    return null;
  }
}
