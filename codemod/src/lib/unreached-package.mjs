/**
 * The `package.json` that a run does not reach. `migrate src --to 18.0` migrates the files under `src`, and phase 2 reads
 * only the `package.json` files the run discovered, so the `package.json` above `src` keeps its old `handsontable`
 * range and nothing says so. `unreachedPackageNotes()` names that file.
 *
 * @module lib/unreached-package
 */
import { stat } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { leavesDirectory } from './paths.mjs';
import { planRange } from './dependency-range.mjs';
import { redact } from './redact.mjs';
import { readUtf8, stripBom } from './text-file.mjs';

const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * The directory a path argument starts from: the path itself, or its folder for a file.
 *
 * @param {string} absolute Absolute path.
 * @returns {Promise<string>} The directory.
 */
async function startDirectory(absolute) {
  const info = await stat(absolute).catch(() => null);

  return info?.isFile() ? dirname(absolute) : absolute;
}

/**
 * Read a `package.json`, or `null` when it is missing, unreadable, or not an object.
 *
 * @param {string} path Absolute path.
 * @returns {Promise<object|null>} The parsed file.
 */
async function readManifest(path) {
  try {
    const value = JSON.parse(stripBom(await readUtf8(path)));

    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    // Missing, not UTF-8, or not JSON: the file names no range this note could use.
    return null;
  }
}

/**
 * Notes for the nearest `package.json` of each path argument that is above the path and was not part of the run, when
 * it asks for a version of a package the run raises.
 *
 * @param {object} args Arguments.
 * @param {string} args.cwd Project directory.
 * @param {string[]} args.paths Path arguments relative to `cwd`. With none, the run covers `cwd` and nothing is above.
 * @param {Set<string>} args.visited Project-relative paths of the `package.json` files the run discovered.
 * @param {Record<string, string>} args.bumps Package name to the version the run raises it to.
 * @returns {Promise<string[]>} One sentence per such file.
 */
export async function unreachedPackageNotes({ cwd, paths, visited, bumps }) {
  const notes = [];
  const seen = new Set();

  for (const path of paths) {
    let directory = await startDirectory(resolve(cwd, path));
    const start = relative(cwd, directory);

    if (leavesDirectory(start)) {
      continue;
    }

    for (;;) {
      const file = posix.join(...relative(cwd, join(directory, 'package.json')).split(sep));
      const manifest = await readManifest(join(directory, 'package.json'));

      if (manifest !== null) {
        // The nearest `package.json` is the one the path belongs to. One the run discovered is migrated already.
        if (!visited.has(file) && !seen.has(file)) {
          seen.add(file);

          for (const [name, target] of Object.entries(bumps)) {
            const spec = SECTIONS.map(section => manifest[section]?.[name]).find(value => typeof value === 'string');

            if (spec !== undefined && planRange(spec, target).action === 'rewrite') {
              notes.push(`${file} is above the paths you passed, so the tool did not edit it. It asks for ${name} `
                + `"${redact(spec)}", and this run migrates to ${target}. Run the tool on it, or update it by hand.`);
            }
          }
        }

        break;
      }

      if (directory === resolve(cwd) || dirname(directory) === directory) {
        break;
      }

      directory = dirname(directory);
    }
  }

  return notes;
}
