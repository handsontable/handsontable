/**
 * Reads a Browserslist configuration and judges the queries it can: an explicit version of a browser. Browserslist
 * itself answers a query such as `defaults` or `last 2 versions` from usage data, which the tool does not have and
 * does not add as a dependency, so those are listed as not checked and never guessed.
 *
 * @module lib/browserslist
 */

import { lstat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { NotUtf8Error, formatSize, readUtf8, stripBom } from './text-file.mjs';

const RC_FILE = '.browserslistrc';
const VERSION = String.raw`\d+(?:\.\d+)*`;
/**
 * The other browsers Browserslist knows by name, and the other names of the ones it does. A query that names one of them
 * and a version (`ie 11`, `samsung 12`, `node 18`) is a query for a browser that the minimums do not cover, so it is
 * left out. A word that is none of them (`since 2020`) is a query of another kind and is not checked.
 */
const OTHER_BROWSERS = new Set(['ie', 'explorer', 'ie_mob', 'explorermobile', 'opera', 'op_mob', 'operamobile',
  'op_mini', 'operamini', 'android', 'bb', 'blackberry', 'and_chr', 'chromeandroid', 'and_ff', 'firefoxandroid',
  'and_uc', 'ucandroid', 'and_qq', 'qqandroid', 'samsung', 'baidu', 'kaios', 'node']);

/**
 * `chrome >= 110`, `Safari 14.1`, `ios_saf 15.2-15.3`, `chrome 100-110`: a browser name, an optional comparison, and
 * a version or a range of versions.
 */
const EXPLICIT = new RegExp(`^([a-z_]+)\\s*(>=|<=|>|<)?\\s*(${VERSION})(?:\\s*-\\s*(${VERSION}))?$`, 'i');

/**
 * Read the `.browserslistrc` next to a `package.json`. A link is not followed, as nothing else in the tool follows one.
 * A file that exists and cannot be used (a link, a directory, too large, not UTF-8, unreadable) comes back with the
 * reason in `skipped`, so the caller can say that it was not checked, and the tool never fails on it. A missing file is
 * no file.
 *
 * @param {string} cwd The project directory.
 * @param {string} packageFile Project-relative path of the `package.json`.
 * @param {number} maxBytes The largest file to read.
 * @returns {Promise<{file: string, text?: string, skipped?: string}|null>} The project-relative path with the text, or
 * with the reason it was not read, or `null` when there is no file.
 */
export async function findBrowserslistrc(cwd, packageFile, maxBytes) {
  const dir = posix.dirname(packageFile);
  const file = dir === '.' ? RC_FILE : posix.join(dir, RC_FILE);
  const skip = reason => ({
    file,
    skipped: `${reason} Its Browserslist queries were not checked, so check them by hand.`,
  });

  try {
    const stats = await lstat(join(cwd, file));

    if (stats.isSymbolicLink()) {
      return skip('The file is a symbolic link, which the tool does not follow.');
    }

    if (!stats.isFile()) {
      return skip('The path is not a regular file.');
    }

    if (stats.size > maxBytes) {
      return skip(`The file is ${formatSize(stats.size)}, above the limit of ${formatSize(maxBytes)}. Raise the limit `
        + 'with --max-file-size.');
    }

    return { file, text: stripBom(await readUtf8(join(cwd, file))) };
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return null;
    }

    return error instanceof NotUtf8Error ? skip('The file is not valid UTF-8.')
      : skip(`The file could not be read: ${error?.code ?? error?.message ?? error}.`);
  }
}

/**
 * Split the text of one query line into its queries. Browserslist reads `,` and `or` as "or", so
 * `chrome >= 110, firefox >= 110` and `chrome >= 110 or firefox >= 110` are two queries each.
 *
 * @param {string} text One line, or one string of a `package.json`.
 * @returns {string[]} The queries, trimmed, with no empty one.
 */
export function splitQueries(text) {
  return text.split(/,|\s+or\s+/i).map(query => query.trim()).filter(Boolean);
}

/**
 * The queries of a `.browserslistrc`: one or more per line, `#` starts a comment, and a `[section]` line names an
 * environment, so the queries of every section count.
 *
 * @param {string} text The file text.
 * @returns {Array<{query: string, line: number}>} Each query with its one-based line.
 */
export function queriesOfRc(text) {
  const found = [];

  text.split(/\r\n|\r|\n/).forEach((raw, index) => {
    const line = raw.replace(/#.*/, '').trim();

    if (line === '' || /^\[.*\]$/.test(line)) {
      return;
    }

    splitQueries(line).forEach(query => found.push({ query, line: index + 1 }));
  });

  return found;
}

/**
 * The queries of the `browserslist` key of a `package.json`: a string, a list of strings, or an object of
 * environments whose values are either. Anything else holds no query.
 *
 * @param {unknown} value The value of the key.
 * @returns {string[]} The queries.
 */
export function queriesOfPackage(value) {
  if (typeof value === 'string') {
    return splitQueries(value);
  }

  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string').flatMap(splitQueries);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(queriesOfPackage);
  }

  return [];
}

/**
 * Split a version into its numbers.
 *
 * @param {string} text A version such as `18.2`.
 * @returns {number[]} The numbers.
 */
function partsOf(text) {
  return text.split('.').map(Number);
}

/**
 * Compare two versions number by number, a missing number counting as 0, so `18.2` is above `18` and `18.0` equals it.
 *
 * @param {number[]} a Left numbers.
 * @param {number[]} b Right numbers.
 * @returns {number} Negative when `a` is lower.
 */
export function compareParts(a, b) {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/**
 * A query that starts with a name and then `all`, `current`, `lts`, or a version: `op_mini all`, `node current`.
 */
const NAMED_BROWSER = /^([a-z_]+)\s+(?:all|current|lts|\d)/i;

/**
 * Whether a query can never select a browser the minimums cover, because every browser it names is another one (or
 * it names Node.js, or the dead browsers, none of which is Chrome, Edge, Firefox, or Safari): `op_mini all`,
 * `maintained node versions`, `current node`, `last 2 ie versions`, `dead`.
 *
 * @param {string} query One query, trimmed.
 * @returns {boolean} `true` when the query is of no interest to the check.
 */
function neverCovered(query) {
  if (/^dead$/i.test(query) || /^(?:current|maintained)\s+node(?:\s+versions?)?$/i.test(query)) {
    return true;
  }

  const named = NAMED_BROWSER.exec(query);

  if (named && OTHER_BROWSERS.has(named[1].toLowerCase())) {
    return true;
  }

  const last = /^(?:last\s+\d+|unreleased)\s+([a-z_]+)\s+versions?$/i.exec(query);

  return last !== null && OTHER_BROWSERS.has(last[1].toLowerCase());
}

/**
 * Whether a query selects a version below a minimum, judged with whole numbers only (never a float, which reads `18.10`
 * as below `18.2`). A browser whose minimum has no minor (Chrome 130) has whole versions only. One whose minimum has a
 * minor (Safari 18.2) has minors, so the last release below the minimum is `18.1`.
 *
 * - `<` and `<=` always take in older versions.
 * - `> n` selects from `floor(n) + 1` for whole versions. For a browser with minors it selects a version below the
 *   minimum when `n` is lower than the last minor before it, so `> 18` and `> 18.0` select 18.1, and `> 18.1` does not.
 * - `>= n` and a bare version start at `n`, which a whole-version browser rounds up (`>= 129.5` starts at 130).
 *
 * @param {string} minimum The minimum version text of the browser.
 * @param {string|undefined} operator The comparison, if any.
 * @param {string} version The version text of the query, or the low end of its range.
 * @returns {boolean} `true` when the query selects something below the minimum.
 */
function selectsBelow(minimum, operator, version) {
  if (operator === '<' || operator === '<=') {
    return true;
  }

  const wanted = partsOf(minimum);
  const written = partsOf(version);
  const whole = wanted.length === 1;

  if (operator === '>') {
    if (whole) {
      return written[0] + 1 < wanted[0];
    }

    // The last release before the minimum. A minimum with minor 0 has no known one, so `> n` counts as below when `n`
    // is lower than the minimum itself.
    const [major, minor] = wanted;

    return compareParts(written, minor > 0 ? [major, minor - 1] : [major, 0]) < 0;
  }

  if (whole && operator === '>=' && written.slice(1).some(part => part > 0)) {
    return written[0] + 1 < wanted[0];
  }

  return compareParts(written, wanted) < 0;
}

/**
 * Judge each query against the minimum versions. A query is below the minimum when it explicitly targets a version
 * of a listed browser that is lower (`selectsBelow()`: `>=` and a bare version from `n`, a range from its low end, `>`
 * from the first release above `n`, `<` and `<=` always).
 *
 * A query with `not` only removes browsers, so it can never lower a target and is left out of both lists. So is a query
 * that names only browsers with no minimum (`ie 11`, `samsung 12`, `node 18`, `op_mini all`, `dead`,
 * `maintained node versions`): it cannot select a browser the minimums cover. A query with `and` is an intersection
 * that the tool cannot judge, and any other form (`defaults`, `last 2 versions`, `> 0.5%`, `extends x`) needs the data
 * of Browserslist: those are in `unchecked`.
 *
 * @param {string[]} queries The queries.
 * @param {{minimums: Record<string, string>, aliases?: Record<string, string>}} spec The minimums by Browserslist
 * name, and the other names of a browser.
 * @returns {{below: string[], unchecked: string[]}} The queries below the minimum and the queries not checked, in the
 * order they were given.
 */
export function judgeQueries(queries, spec) {
  const below = [];
  const unchecked = [];

  for (const query of queries) {
    if (/^not\s/i.test(query) || (!/\sand\s/i.test(query) && neverCovered(query))) {
      continue;
    }

    const match = /\sand\s/i.test(query) ? null : EXPLICIT.exec(query);

    if (!match) {
      unchecked.push(query);
      continue;
    }

    const [, rawName, operator, version, high] = match;
    const lower = rawName.toLowerCase();
    const name = spec.aliases?.[lower] ?? lower;
    const minimum = spec.minimums[name];

    if (minimum === undefined) {
      if (!OTHER_BROWSERS.has(name)) {
        unchecked.push(query);
      }

      continue;
    }

    if (operator && high !== undefined) {
      unchecked.push(query);
      continue;
    }

    if (selectsBelow(minimum, operator, version)) {
      below.push(query);
    }
  }

  return { below, unchecked };
}
