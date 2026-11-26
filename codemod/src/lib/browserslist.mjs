/**
 * Reads a Browserslist configuration and judges the queries it can: an explicit version of a browser. Browserslist
 * itself answers a query such as `defaults` or `last 2 versions` from usage data, which the tool does not have and
 * does not add as a dependency, so those are listed as not checked and never guessed.
 *
 * @module lib/browserslist
 */

import { lstat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { readUtf8, stripBom } from './text-file.mjs';

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
 * Read the `.browserslistrc` next to a `package.json`. A link is not followed, as nothing else in the tool follows one,
 * and a file that is too large, is not UTF-8, or cannot be read is as good as none.
 *
 * @param {string} cwd The project directory.
 * @param {string} packageFile Project-relative path of the `package.json`.
 * @param {number} maxBytes The largest file to read.
 * @returns {Promise<{file: string, text: string}|null>} The project-relative path and the text, or `null`.
 */
export async function findBrowserslistrc(cwd, packageFile, maxBytes) {
  const dir = posix.dirname(packageFile);
  const file = dir === '.' ? RC_FILE : posix.join(dir, RC_FILE);

  try {
    const stats = await lstat(join(cwd, file));

    if (!stats.isFile() || stats.size > maxBytes) {
      return null;
    }

    return { file, text: stripBom(await readUtf8(join(cwd, file))) };
  } catch {
    return null;
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
 * Judge each query against the minimum versions. A query is below the minimum when it explicitly targets a version
 * of a listed browser that is lower:
 *
 * - `>= n`, a bare version, and a range (`100-110`, from its low end) when `n` is below the minimum;
 * - `> n` when the first release above `n` is below the minimum, with a release counted as one step of the last number
 *   you wrote (`> 129` stands for 130, `> 18.1` for 18.2);
 * - `< n` and `<= n` always, because they include every older version.
 *
 * A query with `not` only removes browsers, so it can never lower a target and is left out of both lists. A query for a
 * browser with no minimum (`ie 11`, `samsung 12`, `node 18`) is left out as well. A query with `and` is an intersection that the tool cannot judge, and
 * any other form (`defaults`, `last 2 versions`, `> 0.5%`, `extends x`) needs the data of Browserslist: those are in
 * `unchecked`.
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
    if (/^not\s/i.test(query)) {
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

    const wanted = partsOf(minimum);
    const written = partsOf(version);
    let lowest = written;

    if (operator === '>') {
      lowest = [...written];
      lowest[lowest.length - 1] += 1;
    }

    if (operator === '<' || operator === '<=' || compareParts(lowest, wanted) < 0) {
      below.push(query);
    }
  }

  return { below, unchecked };
}
