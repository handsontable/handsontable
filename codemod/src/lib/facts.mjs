import { posix } from 'node:path';

/**
 * Fact name the runner uses to record the directory of every discovered `package.json`.
 */
export const PACKAGE_FACT = 'package-json';

/**
 * Directory of a project-relative file, `.` for a file in the project root.
 *
 * @param {string} filePath Project-relative path with forward slashes.
 * @returns {string} The directory.
 */
export function dirOf(filePath) {
  return posix.dirname(filePath);
}

/**
 * Tell whether a directory is the same as, or inside, another one.
 *
 * @param {string} dir Directory to test.
 * @param {string} parent Candidate ancestor. `.` is the project root and contains everything.
 * @returns {boolean} `true` when `dir` is `parent` or below it.
 */
export function isInside(dir, parent) {
  return parent === '.' || dir === parent || dir.startsWith(`${parent}/`);
}

/**
 * List the directories recorded for a fact name.
 *
 * @param {Set<string>} facts The shared facts.
 * @param {string} name Fact name.
 * @returns {string[]} The directories, in insertion order.
 */
function directoriesOf(facts, name) {
  const prefix = `${name}@`;

  return [...facts].filter(fact => fact.startsWith(prefix)).map(fact => fact.slice(prefix.length));
}

/**
 * Prefix of the keys that record where a fact was first seen, so a report can name the file and line. The set stays
 * a set of strings: the key is `site:<name>@<dir>=<file>:<line>`, one per fact and directory. `directoriesOf` never
 * reads it, because it only looks at keys that start with `<name>@`.
 */
const SITE_PREFIX = 'site:';

/**
 * The `site:` prefixes already recorded in a set of facts, so asking whether a fact has a site for a directory is one
 * lookup and not a scan of every fact of the run.
 *
 * @type {WeakMap<Set<string>, Set<string>>}
 */
const recordedSites = new WeakMap();

/**
 * The recorded site prefixes of a set of facts.
 *
 * @param {Set<string>} facts The shared facts.
 * @returns {Set<string>} The prefixes (`site:<name>@<dir>=`) that have a key.
 */
function sitesOf(facts) {
  if (!recordedSites.has(facts)) {
    const known = new Set();

    for (const fact of facts) {
      if (fact.startsWith(SITE_PREFIX)) {
        known.add(fact.slice(0, fact.indexOf('=') + 1));
      }
    }

    recordedSites.set(facts, known);
  }

  return recordedSites.get(facts);
}

/**
 * Record a fact for the directory of the file being transformed. It adds two keys: `name`, for code that only
 * asks whether the fact exists anywhere, and `name@<dir>`, for `hasFactFor`. With a `line`, the first sighting in
 * that directory also gets a `site:` key (`factSite` reads it), which holds the file and the line in the file.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @param {string} name Fact name, lowercase kebab-case.
 * @param {number} [line] One-based line of the first match, relative to the part. The part's `lineOffset` is added.
 * @returns {void}
 */
export function addFact(ctx, name, line) {
  const dir = dirOf(ctx.filePath);

  ctx.facts.add(name);
  ctx.facts.add(`${name}@${dir}`);

  const prefix = `${SITE_PREFIX}${name}@${dir}=`;

  if (Number.isInteger(line) && !sitesOf(ctx.facts).has(prefix)) {
    sitesOf(ctx.facts).add(prefix);
    ctx.facts.add(`${prefix}${ctx.filePath}:${line + (ctx.lineOffset ?? 0)}`);
  }
}

/**
 * Where a fact was first seen for the project that owns the `package.json` being transformed, by the same
 * nearest-package rule as `hasFactFor`.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `package.json`.
 * @param {string} name Fact name.
 * @returns {string|null} `file:line` of the first sighting, or `null` when none was recorded with a line.
 */
export function factSite(ctx, name) {
  const own = dirOf(ctx.filePath);
  const packageDirs = directoriesOf(ctx.facts, PACKAGE_FACT);
  const prefix = `${SITE_PREFIX}${name}@`;

  for (const fact of ctx.facts) {
    if (!fact.startsWith(prefix)) {
      continue;
    }

    const separator = fact.indexOf('=', prefix.length);
    const dir = fact.slice(prefix.length, separator);

    const nested = packageDirs.some(other => other !== own && isInside(other, own) && isInside(dir, other));

    if (isInside(dir, own) && !nested) {
      return fact.slice(separator + 1);
    }
  }

  return null;
}

/**
 * Tell whether a fact was recorded for the project that owns the `package.json` being transformed. A fact
 * belongs to the nearest `package.json` above the file it came from, so in a monorepo a fact from
 * `packages/a/src/x.js` counts for `packages/a/package.json` and not for the root one.
 *
 * The nearest-package rule needs the directories of every `package.json`, which the runner records with
 * `registerPackageDir`. A caller that transforms one file alone (a fixture) has none, and then every fact
 * recorded below this `package.json`'s directory counts.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `package.json`.
 * @param {string} name Fact name.
 * @returns {boolean} `true` when a file owned by this `package.json` recorded the fact.
 */
export function hasFactFor(ctx, name) {
  const own = dirOf(ctx.filePath);
  const packageDirs = directoriesOf(ctx.facts, PACKAGE_FACT);

  return directoriesOf(ctx.facts, name).some(dir => isInside(dir, own)
    && !packageDirs.some(other => other !== own && isInside(other, own) && isInside(dir, other)));
}

/**
 * Record the directory of a discovered `package.json`. The runner calls it for every one before phase 1.
 *
 * @param {Set<string>} facts The shared facts.
 * @param {string} filePath Project-relative path of the `package.json`.
 * @returns {void}
 */
export function registerPackageDir(facts, filePath) {
  facts.add(`${PACKAGE_FACT}@${dirOf(filePath)}`);
}

/**
 * The recorded `package.json` files that sit above a file, the nearest first. A `package.json` is not above itself.
 *
 * @param {Set<string>} facts The shared facts.
 * @param {string} filePath Project-relative path of a `package.json`.
 * @param {object} [options] Options.
 * @param {boolean} [options.includeOwn] Also list the `package.json` in the directory of the file, for a file that is
 * not a `package.json` itself (an HTML page).
 * @returns {string[]} Project-relative paths with forward slashes.
 */
export function packageFilesAbove(facts, filePath, { includeOwn = false } = {}) {
  const own = dirOf(filePath);

  return directoriesOf(facts, PACKAGE_FACT)
    .filter(dir => (includeOwn || dir !== own) && isInside(own, dir))
    .sort((a, b) => (b === '.' ? 0 : b.length) - (a === '.' ? 0 : a.length))
    .map(dir => (dir === '.' ? 'package.json' : `${dir}/package.json`));
}
