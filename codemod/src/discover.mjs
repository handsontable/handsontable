import { readdir, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { isCandidate } from './adapters/index.mjs';
import { UsageError } from './errors.mjs';
import { isGitRepo, listFiles } from './git.mjs';

/**
 * Directory names discovery never enters or lists.
 */
export const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

/**
 * Convert a platform path to a forward-slash path.
 *
 * @param {string} path Path with the platform separator.
 * @returns {string} Path with forward slashes.
 */
function toPosix(path) {
  return sep === '/' ? path : path.split(sep).join('/');
}

/**
 * Tell whether a project-relative path is generated or vendored output: it sits under a skipped directory,
 * is a minified file, or is a type declaration file.
 *
 * @param {string} filePath Project-relative path with forward slashes.
 * @returns {boolean} `true` when discovery leaves the file out.
 */
export function isSkipped(filePath) {
  const segments = filePath.split('/');
  const name = segments[segments.length - 1];

  return segments.slice(0, -1).some(segment => SKIPPED_DIRECTORIES.has(segment))
    || /\.min\.[^/]+$/.test(name)
    || name.endsWith('.d.ts')
    || name.endsWith('.d.mts')
    || name.endsWith('.d.cts');
}

/**
 * Walk a directory without git, skipping the skipped directories and symbolic links.
 *
 * @param {string} dir Absolute directory path.
 * @param {string} cwd Project directory that paths are made relative to.
 * @param {string[]} out Collected project-relative paths.
 * @returns {Promise<void>}
 */
async function walk(dir, cwd, out) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        await walk(join(dir, entry.name), cwd, out);
      }
    } else if (entry.isFile()) {
      out.push(toPosix(relative(cwd, join(dir, entry.name))));
    }
  }
}

/**
 * Tell whether a regular file exists at a path.
 *
 * @param {string} path Absolute path.
 * @returns {Promise<boolean>} `true` for an existing regular file.
 */
async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    // A path git still lists but that is gone from disk (deleted, not yet staged) is not a file to migrate.
    return false;
  }
}

/**
 * Find the files to migrate. Inside a git repository the list is `git ls-files --cached --others
 * --exclude-standard`, so ignored files never appear. Otherwise the directory is walked. In both cases
 * generated output is dropped (see `isSkipped`), deleted files are dropped, and only files an adapter can
 * handle remain. A file named explicitly on the command line bypasses the generated-output filter.
 *
 * @param {object} options Options.
 * @param {string} options.cwd Project directory. Returned paths are relative to it.
 * @param {string[]} [options.paths] Files or directories to search, relative to `cwd`. Defaults to `cwd`.
 * @returns {Promise<string[]>} Sorted project-relative paths with forward slashes.
 */
export async function discover({ cwd, paths = [] }) {
  const roots = paths.length > 0 ? paths : ['.'];
  const found = new Set();
  const repo = await isGitRepo(cwd);
  const tracked = repo ? await listFiles(cwd) : null;

  for (const root of roots) {
    const absolute = resolve(cwd, root);
    const rel = toPosix(relative(cwd, absolute));

    if (rel.startsWith('..')) {
      throw new UsageError(`"${root}" is outside the project directory.`);
    }

    let info;

    try {
      info = await stat(absolute);
    } catch {
      throw new UsageError(`"${root}" does not exist.`);
    }

    if (info.isFile()) {
      if (isCandidate(rel)) {
        found.add(rel);
      }

      continue;
    }

    const candidates = [];

    if (tracked) {
      const prefix = rel === '' ? '' : `${rel}/`;

      candidates.push(...tracked.filter(file => file.startsWith(prefix)));
    } else {
      await walk(absolute, cwd, candidates);
    }

    for (const file of candidates) {
      if (isCandidate(file) && !isSkipped(file) && (await isFile(join(cwd, file)))) {
        found.add(file);
      }
    }
  }

  return [...found].sort();
}
