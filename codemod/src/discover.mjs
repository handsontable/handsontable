import { lstat, readdir, realpath, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { isCandidate } from './adapters/index.mjs';
import { UsageError } from './errors.mjs';
import { GitError, isGitRepo, isIgnored, listFiles } from './git.mjs';
import { plainName } from './lib/markdown.mjs';
import { insideRelative, leavesDirectory, realpathNative, toPosix } from './lib/paths.mjs';

export { leavesDirectory };

/**
 * How many paths one batch of `lstat` calls holds.
 */
const FILE_CHECK_CHUNK = 256;

/**
 * Directory names discovery never enters or lists.
 */
export const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

/**
 * Directory names that only the walk (a project outside git) leaves out, besides `SKIPPED_DIRECTORIES` and every
 * directory that starts with a dot (`.next`, `.nuxt`, `.output`, `.svelte-kit`, `.angular`, `.cache`, `.turbo`,
 * `.vercel`, ...). Inside git the ignore rules tell build output from source. Without them the tool cannot, and
 * rewriting a bundler's output costs more than skipping a hidden folder that holds source (`.storybook`), which the
 * report names.
 */
export const BUILD_OUTPUT_DIRECTORIES = new Set(['out', 'storybook-static', 'bower_components', 'jspm_packages',
  '_site']);

/**
 * Tell whether the walk leaves a directory out although it is not in `SKIPPED_DIRECTORIES`.
 *
 * @param {string} name Directory name.
 * @returns {boolean} `true` for a dot-directory or a build output name.
 */
function isWalkSkipped(name) {
  return name.startsWith('.') || BUILD_OUTPUT_DIRECTORIES.has(name);
}

/**
 * Tell whether a project-relative path sits below a `node_modules` directory.
 *
 * @param {string} filePath Project-relative path with forward slashes.
 * @returns {boolean} `true` when a directory of the path is named `node_modules`.
 */
function underNodeModules(filePath) {
  return filePath.split('/').slice(0, -1).includes('node_modules');
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
 * Something discovery left out and the report must name.
 *
 * - `link` (the default): a symbolic link that was not followed.
 * - `repository`: a submodule or an embedded git repository. Git lists it as one entry, and the files in it belong to
 *   another repository, so the tool does not read them.
 * - `directory`: a directory the walk skipped because it cannot tell build output from source without git.
 *
 * @typedef {object} SkippedLink
 * @property {string} file Project-relative path with forward slashes of the link, repository, or directory itself.
 * @property {'link'|'repository'|'directory'|'unreadable'} [kind] What it is. Defaults to `link`.
 * @property {string} [reason] For `unreadable`, the error code of the failed read (`EACCES`).
 */

/**
 * Tell whether a directory holds a file that discovery would otherwise read, anywhere below it. The search stops at
 * the first one and follows no symbolic link.
 *
 * @param {string} dir Absolute directory path.
 * @param {string} cwd Project directory that paths are made relative to.
 * @returns {Promise<boolean>} `true` when a handled file is below `dir`.
 */
async function holdsCandidate(dir, cwd) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      // The walk skips the same names below the first directory, so a file only there is not one it would read.
      if (!SKIPPED_DIRECTORIES.has(entry.name) && !isWalkSkipped(entry.name) && await holdsCandidate(path, cwd)) {
        return true;
      }
    } else if (entry.isFile()) {
      const rel = toPosix(relative(cwd, path));

      if (isCandidate(rel) && !isSkipped(rel)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Say why a directory could not be read, for a sentence that names the directory first.
 *
 * @param {Error & {code?: string}} error The error of `readdir`.
 * @returns {string} A short phrase with the error code, for example `permission denied (EACCES)`.
 */
function readFailure(error) {
  const reasons = {
    EACCES: 'permission denied',
    EPERM: 'permission denied',
    ENOENT: 'it was removed',
    ENOTDIR: 'it is not a directory',
  };
  const code = error?.code ?? 'ERROR';

  return `${reasons[code] ?? 'the read failed'} (${code})`;
}

/**
 * Walk a directory without git, skipping the skipped directories. A symbolic link is never followed: a link to a
 * file that a rule could edit, or to a directory, is handed to `onLink`.
 *
 * A dot-directory or a build output name (`isWalkSkipped()`) is not entered either, and `onDirectory` hears of it when
 * it holds a file the walk would otherwise read. A directory below the first that cannot be read (permission denied,
 * removed during the walk) is handed to `onUnreadable`, and the walk goes on, so one bad directory does not cost the
 * work of the others. The directory the walk starts from is different: when it cannot be read there is nothing to
 * migrate, and the error is thrown for `discover()` to turn into a usage error that names the directory.
 *
 * @param {string} dir Absolute directory path.
 * @param {string} cwd Project directory that paths are made relative to.
 * @param {string[]} out Collected project-relative paths.
 * @param {object} hooks Callbacks.
 * @param {(file: string) => void} hooks.onLink Called with the project-relative path of a link that was left out.
 * @param {(file: string) => void} hooks.onDirectory Called with the project-relative path of a directory that was
 * skipped and holds readable files.
 * @param {(file: string, code: string) => void} hooks.onUnreadable Called with the project-relative path of a
 * directory below the start that could not be read, and the error code.
 * @param {boolean} [top] `true` for the directory the walk starts from.
 * @returns {Promise<void>}
 */
async function walk(dir, cwd, out, hooks, top = true) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (top) {
      throw error;
    }

    hooks.onUnreadable(toPosix(relative(cwd, dir)), error.code ?? 'ERROR');

    return;
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      if (isWalkSkipped(entry.name)) {
        if (await holdsCandidate(path, cwd)) {
          hooks.onDirectory(toPosix(relative(cwd, path)));
        }

        continue;
      }

      await walk(path, cwd, out, hooks, false);
    } else if (entry.isFile()) {
      out.push(toPosix(relative(cwd, path)));
    } else if (entry.isSymbolicLink()) {
      const rel = toPosix(relative(cwd, path));
      const target = await stat(path).catch(() => null);
      const matters = target?.isDirectory() ? !SKIPPED_DIRECTORIES.has(entry.name)
        : Boolean(target) && isCandidate(rel) && !isSkipped(rel);

      if (matters) {
        hooks.onLink(rel);
      }
    }
  }
}

/**
 * Find the entries of a git file list that are a symbolic link to a directory, or a directory of their own. Git lists a
 * link to a directory as one entry with no sign of the directory behind it, and a submodule (a gitlink) or an embedded
 * repository as one entry too (the embedded one with a trailing slash), and their names usually have no handled
 * extension, so the file filter drops them silently. Only entries no adapter handles are checked, because a handled
 * one goes through `isFile`.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} files Project-relative paths with forward slashes.
 * @returns {Promise<{links: string[], repositories: string[]}>} The links to a directory that the walk would also
 * leave out, and the directories git lists as one entry (the path has no trailing slash).
 */
async function unhandledEntries(cwd, files) {
  const unhandled = files.filter(file => !isCandidate(file) && !isSkipped(file)
    && !SKIPPED_DIRECTORIES.has(file.replace(/\/$/, '').split('/').pop()));
  const links = [];
  const repositories = [];

  for (let start = 0; start < unhandled.length; start += FILE_CHECK_CHUNK) {
    const batch = unhandled.slice(start, start + FILE_CHECK_CHUNK);
    const results = await Promise.all(batch.map(async(file) => {
      const path = join(cwd, file.replace(/\/$/, ''));
      const info = await lstat(path).catch(() => null);

      if (info?.isSymbolicLink()) {
        return (await stat(path).catch(() => null))?.isDirectory() ? { link: file } : null;
      }

      return info?.isDirectory() ? { repository: file.replace(/\/$/, '') } : null;
    }));

    results.forEach((result) => {
      if (result?.link) {
        links.push(result.link);
      } else if (result?.repository) {
        repositories.push(result.repository);
      }
    });
  }

  return { links, repositories };
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
 * Check the candidates among some project-relative paths with `isFile()`, in chunks of `FILE_CHECK_CHUNK` at once,
 * because a repository lists tens of thousands of files and one round trip after another is slow on a network
 * mount or on Windows. The results keep the order of the list, so the links are reported in that order.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} files Project-relative paths with forward slashes.
 * @returns {Promise<Array<{file: string, regular: boolean, isLink: boolean}>>} One result per path that the file
 * filter keeps, in order: whether it is an existing regular file, and whether it is a symbolic link.
 */
async function checkFiles(cwd, files) {
  const wanted = files.filter(file => isCandidate(file) && !isSkipped(file));
  const results = [];

  for (let start = 0; start < wanted.length; start += FILE_CHECK_CHUNK) {
    const batch = wanted.slice(start, start + FILE_CHECK_CHUNK);

    results.push(...await Promise.all(batch.map(async(file) => {
      let isLink = false;
      const regular = await isFile(join(cwd, file), () => {
        isLink = true;
      });

      return { file, regular, isLink };
    })));
  }

  return results;
}

/**
 * Find the first symbolic link on the way from a base directory to a path, the path itself included.
 *
 * @param {string} cwd Base directory. A link in `cwd` itself or above it is not looked at.
 * @param {string} rel Relative path with the platform separator, inside `cwd`.
 * @returns {Promise<string|null>} The relative path of the link, or `null` when no component is a link.
 */
export async function firstLinkOn(cwd, rel) {
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
 * The spelling of a path argument that the file system stores. On a case-insensitive file system `SRC` names the
 * directory `src`, but git lists `src/...`, so a prefix match on `SRC/` finds nothing.
 *
 * @param {string} cwd Project directory.
 * @param {string} absolute Absolute path of the argument.
 * @param {string} raw The argument as `relative(cwd, absolute)`, with the platform separator.
 * @returns {Promise<string>} The path as stored when it differs from `raw` in letter case only, else `raw`.
 */
async function storedSpelling(cwd, absolute, raw) {
  try {
    const [base, real] = await Promise.all([realpathNative(cwd), realpathNative(absolute)]);
    const actual = relative(base, real);

    return !leavesDirectory(actual) && actual !== raw && actual.toLowerCase() === raw.toLowerCase() ? actual : raw;
  } catch {
    return raw;
  }
}

/**
 * Find the files to migrate. Inside a git repository the list is `git ls-files --cached --others
 * --exclude-standard`, so ignored files never appear, and "ignored" is what git itself says: the `.gitignore` files of
 * the repository and of every directory above it, `.git/info/exclude`, and the user's global ignore file
 * (`core.excludesFile`). That is the same set `git status` hides, so the clean-tree guard and the file list agree. A
 * project directory that an outer repository ignores gets an empty list from git, so it is walked instead (see
 * `notes`). Without git the directory is walked. In both cases generated output is dropped (see `isSkipped`), deleted
 * files are dropped, and only files an adapter can handle remain. A file named explicitly on the command line
 * bypasses the generated-output filter.
 *
 * @param {object} options Options.
 * @param {string} options.cwd Project directory. Returned paths are relative to it.
 * @param {string[]} [options.paths] Files or directories to search, relative to `cwd`. Defaults to `cwd`.
 * @param {SkippedLink[]} [options.skipped] Receives one item per symbolic link that was left out: a file or
 * directory link met while searching, a path argument that is a link or sits below one. Symbolic links are never
 * followed, because a link can point outside the project. It also gets the submodules and embedded repositories git
 * lists as one entry, and the directories the walk skipped (see `walk`).
 * @param {string[]} [options.notes] Receives a sentence for what changed how the search ran: the walk that replaced
 * git, a path argument read in the letter case the file system stores.
 * @param {string[]} [options.reasons] Receives a sentence for each path argument that gave no file. The caller says
 * them when the whole run found nothing.
 * @returns {Promise<string[]>} Sorted project-relative paths with forward slashes.
 */
export async function discover({ cwd, paths = [], skipped = [], notes = [], reasons = [] }) {
  const roots = paths.length > 0 ? paths : ['.'];
  const found = new Set();
  const links = new Set();
  // A git that ran and failed was reported by the caller: the walk below reads the files without it.
  const repo = await isGitRepo(cwd).catch((error) => {
    if (error instanceof GitError) {
      return false;
    }

    throw error;
  });
  let tracked = repo ? await listFiles(cwd) : null;
  const noteSkipped = (file, kind, reason) => {
    if (!links.has(file)) {
      links.add(file);
      skipped.push(reason === undefined ? { file, kind } : { file, kind, reason });
    }
  };
  const noteLink = file => noteSkipped(file, 'link');

  if (tracked !== null && tracked.length === 0 && await isIgnored(cwd)) {
    tracked = null;
    notes.push('A .gitignore above this directory ignores it, so git lists no file here. The tool walked the directory '
      + 'instead, and no ignore rule applies. git diff will not show what changed.');
  }

  for (const root of roots) {
    const absolute = resolve(cwd, root);
    const raw = relative(cwd, absolute);
    // The path as the user typed it, spelled like a file name: a line break or an escape in it never reaches a message raw.
    const typed = plainName(root);

    if (leavesDirectory(raw)) {
      throw new UsageError(`"${typed}" is outside the project directory.`);
    }

    const link = await firstLinkOn(cwd, raw);

    if (link !== null) {
      noteLink(toPosix(link));

      continue;
    }

    let info;

    try {
      info = await stat(absolute);
    } catch {
      throw new UsageError(`"${typed}" does not exist.`);
    }

    const spelled = raw === '' ? raw : await storedSpelling(cwd, absolute, raw);
    const rel = toPosix(spelled);
    const label = rel === '' ? 'The project directory' : `"${typed}"`;

    if (spelled !== raw) {
      notes.push(`"${typed}" is spelled "${plainName(rel)}" on disk, so the tool read it as "${plainName(rel)}".`);
    }

    if (info.isFile()) {
      if (isCandidate(rel)) {
        // The directory form never reaches these files, so naming one must not either: git hides an ignored file from
        // `git status`, and a dependency's files are not the project's to migrate.
        if (underNodeModules(rel)) {
          reasons.push(`${label} is below node_modules, and the tool reads no file there.`);
        } else if (tracked && await isIgnored(cwd, rel)) {
          reasons.push(`${label} is ignored by git, and the tool reads no ignored file.`);
        } else {
          found.add(rel);
        }
      } else {
        reasons.push(`${label} is not a type of file the tool reads.`);
      }

      continue;
    }

    const candidates = [];
    const before = found.size;
    let listed = 0;

    if (tracked) {
      const prefix = rel === '' ? '' : `${rel}/`;
      const inside = tracked.filter(file => file.startsWith(prefix));
      const { links: directoryLinks, repositories } = await unhandledEntries(cwd, inside);

      listed = inside.length;

      // A loop, not a spread: a list of more than about a hundred thousand names is too many arguments for one call.
      for (const file of inside) {
        candidates.push(file);
      }

      directoryLinks.forEach(noteLink);
      repositories.forEach(file => noteSkipped(file, 'repository'));

      if (listed === 0) {
        reasons.push(await isIgnored(cwd, rel === '' ? '.' : rel)
          ? `${label} is ignored by git, and the tool reads no ignored file.`
          : `git lists no file under ${label}.`);
      }
    } else {
      try {
        await walk(absolute, cwd, candidates, {
          onLink: noteLink,
          onDirectory: file => noteSkipped(file, 'directory'),
          onUnreadable: (file, code) => noteSkipped(file, 'unreadable', code),
        });
      } catch (error) {
        // The directory the walk starts from cannot be read: there is nothing to migrate, and the reason is the answer.
        throw new UsageError(`${label} could not be read: ${readFailure(error)}. Fix the permissions, or choose `
          + 'another path.');
      }
      listed = candidates.length;

      if (listed === 0) {
        reasons.push(`${label} holds no file.`);
      }
    }

    for (const { file, regular, isLink } of await checkFiles(cwd, candidates)) {
      if (isLink) {
        noteLink(file);
      }

      if (regular) {
        found.add(file);
      }
    }

    if (listed > 0 && found.size === before) {
      reasons.push(`${label} holds no source, style, template, or package.json file that the tool reads.`);
    }
  }

  return [...found].sort();
}
