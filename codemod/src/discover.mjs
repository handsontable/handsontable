import { lstat, readdir, realpath, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { isCandidate } from './adapters/index.mjs';
import { UsageError } from './errors.mjs';
import { isGitRepo, listFiles } from './git.mjs';
import { insideRelative, leavesDirectory, toPosix } from './lib/paths.mjs';

export { leavesDirectory };

/**
 * Directory names discovery never enters or lists.
 */
export const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

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
 * A symbolic link that discovery did not follow.
 *
 * @typedef {object} SkippedLink
 * @property {string} file Project-relative path with forward slashes of the link itself.
 */

/**
 * Walk a directory without git, skipping the skipped directories. A symbolic link is never followed: a link to a
 * file that a rule could edit, or to a directory, is handed to `onLink`.
 *
 * @param {string} dir Absolute directory path.
 * @param {string} cwd Project directory that paths are made relative to.
 * @param {string[]} out Collected project-relative paths.
 * @param {(file: string) => void} onLink Called with the project-relative path of a link that was left out.
 * @returns {Promise<void>}
 */
async function walk(dir, cwd, out, onLink) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        await walk(path, cwd, out, onLink);
      }
    } else if (entry.isFile()) {
      out.push(toPosix(relative(cwd, path)));
    } else if (entry.isSymbolicLink()) {
      const rel = toPosix(relative(cwd, path));
      const target = await stat(path).catch(() => null);
      const matters = target?.isDirectory() ? !SKIPPED_DIRECTORIES.has(entry.name)
        : Boolean(target) && isCandidate(rel) && !isSkipped(rel);

      if (matters) {
        onLink(rel);
      }
    }
  }
}

/**
 * Find the entries of a git file list that are symbolic links to a directory. Git lists such a link as one entry
 * with no sign of the directory behind it, and its name usually has no handled extension, so the file filter drops it
 * silently. Only entries no adapter handles are checked, because a handled one goes through `isFile`.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} files Project-relative paths with forward slashes.
 * @returns {Promise<string[]>} The paths of the links to a directory that the walk would also leave out.
 */
async function directoryLinks(cwd, files) {
  const unhandled = files.filter(file => !isCandidate(file) && !isSkipped(file)
    && !SKIPPED_DIRECTORIES.has(file.split('/').pop()));
  const links = [];

  for (let start = 0; start < unhandled.length; start += 256) {
    const batch = unhandled.slice(start, start + 256);
    const results = await Promise.all(batch.map(async(file) => {
      const info = await lstat(join(cwd, file)).catch(() => null);

      return info?.isSymbolicLink() && (await stat(join(cwd, file)).catch(() => null))?.isDirectory() ? file : null;
    }));

    links.push(...results.filter(Boolean));
  }

  return links;
}

/**
 * Tell whether a regular file exists at a path. A symbolic link is not a regular file, so it is reported to
 * `onLink` and left out.
 *
 * @param {string} path Absolute path.
 * @param {() => void} onLink Called when the path is a symbolic link.
 * @returns {Promise<boolean>} `true` for an existing regular file.
 */
async function isFile(path, onLink) {
  try {
    const info = await lstat(path);

    if (info.isSymbolicLink()) {
      onLink();

      return false;
    }

    return info.isFile();
  } catch {
    // A path git still lists but that is gone from disk (deleted, not yet staged) is not a file to migrate.
    return false;
  }
}

/**
 * Find the first symbolic link on the way from the project directory to a path, the path itself included.
 *
 * @param {string} cwd Project directory.
 * @param {string} rel Relative path with the platform separator, inside `cwd`.
 * @returns {Promise<string|null>} The relative path of the link, or `null` when no component is a link.
 */
async function firstLinkOn(cwd, rel) {
  const segments = rel.split(sep).filter(Boolean);

  for (let count = 1; count <= segments.length; count += 1) {
    const prefix = segments.slice(0, count).join(sep);
    const info = await lstat(join(cwd, prefix)).catch(() => null);

    if (info?.isSymbolicLink()) {
      return prefix;
    }
  }

  return null;
}

/**
 * Tell whether a file's real location, with every link resolved, is inside the project's real directory. The run
 * checks it before it writes.
 *
 * @param {string} cwd Project directory.
 * @param {string} file Project-relative path.
 * @returns {Promise<boolean>} `true` when the file resolves to a place inside the project.
 */
export async function resolvesInside(cwd, file) {
  try {
    const [root, real] = await Promise.all([realpath(cwd), realpath(join(cwd, file))]);

    return insideRelative(root, real) !== null;
  } catch {
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
 * @param {SkippedLink[]} [options.skipped] Receives one item per symbolic link that was left out: a file or
 * directory link met while searching, a path argument that is a link or sits below one. Symbolic links are never
 * followed, because a link can point outside the project.
 * @returns {Promise<string[]>} Sorted project-relative paths with forward slashes.
 */
export async function discover({ cwd, paths = [], skipped = [] }) {
  const roots = paths.length > 0 ? paths : ['.'];
  const found = new Set();
  const links = new Set();
  const repo = await isGitRepo(cwd);
  const tracked = repo ? await listFiles(cwd) : null;
  const noteLink = (file) => {
    if (!links.has(file)) {
      links.add(file);
      skipped.push({ file });
    }
  };

  for (const root of roots) {
    const absolute = resolve(cwd, root);
    const raw = relative(cwd, absolute);

    if (leavesDirectory(raw)) {
      throw new UsageError(`"${root}" is outside the project directory.`);
    }

    const rel = toPosix(raw);
    const link = await firstLinkOn(cwd, raw);

    if (link !== null) {
      noteLink(toPosix(link));

      continue;
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

      const inside = tracked.filter(file => file.startsWith(prefix));

      candidates.push(...inside);
      (await directoryLinks(cwd, inside)).forEach(noteLink);
    } else {
      await walk(absolute, cwd, candidates, noteLink);
    }

    for (const file of candidates) {
      if (isCandidate(file) && !isSkipped(file) && (await isFile(join(cwd, file), () => noteLink(file)))) {
        found.add(file);
      }
    }
  }

  return [...found].sort();
}
