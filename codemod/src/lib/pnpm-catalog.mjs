/**
 * Reads the `catalog:` and `catalogs:` sections of a `pnpm-workspace.yaml`, so a report can name the range a
 * `catalog:` dependency takes. It is a line scan for the block form pnpm documents, not a YAML parser: a form it does
 * not understand (flow style, an anchor, a nested value) gives no entry, and the report then keeps its generic text.
 *
 * @module lib/pnpm-catalog
 */

import { join, posix } from 'node:path';
import { readUtf8, stripBom } from './text-file.mjs';

const WORKSPACE_FILE = 'pnpm-workspace.yaml';
const UNREADABLE_VALUE = /^[*&[{|>!%@`]/;

/**
 * Split a `key: value` line of a block mapping.
 *
 * @param {string} text The line without its indentation.
 * @returns {{key: string, value: string}|null} The unquoted key and the raw value, or `null` for a line that is
 * not a mapping entry (a list item, for example).
 */
function splitEntry(text) {
  const quoted = /^(['"])(.*?)\1\s*:(?:\s+(.*))?$/.exec(text);

  if (quoted) {
    return { key: quoted[2], value: (quoted[3] ?? '').trim() };
  }

  const bare = /^([^\s'"#:][^:#]*?)\s*:(?:\s+(.*))?$/.exec(text);

  return bare ? { key: bare[1], value: (bare[2] ?? '').trim() } : null;
}

/**
 * The text of a scalar value, without quotes and without a trailing comment.
 *
 * @param {string} raw The raw value after the colon.
 * @returns {string|null} The value, or `null` when it is empty or a form that is not read.
 */
function scalar(raw) {
  const quoted = /^(['"])(.*?)\1\s*(?:#.*)?$/.exec(raw);

  if (quoted) {
    return quoted[2] === '' ? null : quoted[2];
  }

  const text = raw.replace(/\s+#.*$/, '').trim();

  return text === '' || UNREADABLE_VALUE.test(text) ? null : text;
}

/**
 * Read the catalogs of a `pnpm-workspace.yaml` text.
 *
 * @param {string} text The file text.
 * @returns {Map<string, Map<string, string>>} The package ranges by catalog. The default catalog is `''`, whether it
 * is written as `catalog:` or as `catalogs: default:`. A catalog with no readable entry may be missing.
 */
export function parseCatalogs(text) {
  const catalogs = new Map();
  const add = (catalog, name, range) => {
    if (!catalogs.has(catalog)) {
      catalogs.set(catalog, new Map());
    }

    catalogs.get(catalog).set(name, range);
  };
  let section = null;
  let levelOne = null;
  let levelTwo = null;
  let catalog = null;

  for (const line of text.split(/\r?\n/)) {
    const body = line.trim();

    if (body === '' || body.startsWith('#')) {
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const entry = splitEntry(body);

    if (indent === 0) {
      section = entry && (entry.key === 'catalog' || entry.key === 'catalogs') ? entry.key : null;
      levelOne = null;
      levelTwo = null;
      catalog = null;
      continue;
    }

    if (!section || !entry) {
      continue;
    }

    levelOne ??= indent;

    if (section === 'catalog') {
      const range = scalar(entry.value);

      if (indent === levelOne && range) {
        add('', entry.key, range);
      }

      continue;
    }

    if (indent === levelOne) {
      catalog = entry.value === '' ? entry.key : null;

      if (catalog === 'default') {
        catalog = '';
      }

      levelTwo = null;
      continue;
    }

    levelTwo ??= indent;

    const range = scalar(entry.value);

    if (catalog !== null && indent === levelTwo && range) {
      add(catalog, entry.key, range);
    }
  }

  return catalogs;
}

/**
 * Find the `pnpm-workspace.yaml` that applies to a `package.json`: the nearest one from its directory up to the project
 * directory.
 *
 * @param {string} cwd Project directory.
 * @param {string} packageFile Project-relative path of the `package.json`, with forward slashes.
 * @returns {Promise<{file: string, catalogs: Map<string, Map<string, string>>}|null>} The project-relative path of
 * the workspace file and its catalogs, or `null` when no workspace file lies in between.
 */
export async function findCatalog(cwd, packageFile) {
  let dir = posix.dirname(packageFile);

  for (;;) {
    const file = dir === '.' ? WORKSPACE_FILE : posix.join(dir, WORKSPACE_FILE);

    try {
      return { file, catalogs: parseCatalogs(stripBom(await readUtf8(join(cwd, file)))) };
    } catch {
      // No workspace file here, or one that cannot be read: look one directory up.
    }

    if (dir === '.' || dir === '/') {
      return null;
    }

    dir = posix.dirname(dir);
  }
}
