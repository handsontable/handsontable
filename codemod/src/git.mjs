import { execFile } from 'node:child_process';
import { lstat, realpath, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { findExecutable } from './lib/find-executable.mjs';

const execFileAsync = promisify(execFile);

/**
 * Raised when git ran and failed for a reason other than "this is not a repository": "detected dubious ownership" in a
 * container or a CI mount, a corrupt repository, a refused permission. The tool cannot tell a clean tree from a dirty
 * one then, so the caller must not read the failure as "no repository, nothing to guard".
 */
export class GitError extends Error {
  /**
   * @param {string} message What git printed, the first lines of its standard error.
   */
  constructor(message) {
    super(message);

    this.name = 'GitError';
  }
}

/**
 * Raised when there is no git program to run and a `.git` entry (a directory, or the file of a linked work tree or a
 * submodule) stands at or above the directory, so there is a repository whose uncommitted changes the tool cannot see.
 * Without such an entry no git program means nothing to guard, and `isGitRepo()` answers `false`.
 */
export class GitNotFoundError extends GitError {
  /**
   * @param {string} directory The directory that holds the `.git` entry.
   */
  constructor(directory) {
    super(`git was not found on PATH, and ${directory} holds a .git entry.`);

    this.name = 'GitNotFoundError';
    this.directory = directory;
  }
}

/**
 * Raised when there is no git program to run, which behaves as outside a repository.
 */
class GitMissing extends Error {}

/**
 * The nearest directory at or above a directory that holds a `.git` entry, of any kind.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<string|null>} The directory, or `null` when no directory above holds one.
 */
async function directoryWithGitEntry(cwd) {
  for (let directory = resolve(cwd); ; directory = dirname(directory)) {
    if (await stat(join(directory, '.git')).then(() => true, () => false)) {
      return directory;
    }

    if (dirname(directory) === directory) {
      return null;
    }
  }
}

/**
 * Environment for git child processes. A run started from inside a git hook inherits `GIT_DIR` and friends,
 * which would point git at the hook's repository instead of the project.
 *
 * @returns {NodeJS.ProcessEnv} A copy of `process.env` without the repository-selecting variables, and with `LC_ALL=C`.
 */
function gitEnv() {
  const env = { ...process.env };

  ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX'].forEach(name => delete env[name]);

  // The tool reads one message of git (`isGitRepo()`), so git must say it in English whatever the user's language is.
  env.LC_ALL = 'C';

  return env;
}

/**
 * Options in front of every git command the tool runs, because a repository's own configuration can make git execute
 * a program:
 *
 * - `core.fsmonitor` names a command that `git status` and `git ls-files` run to learn which files changed. A
 *   repository can set it to anything, so it is turned off.
 * - `--no-pager` keeps `core.pager` and `pager.<command>` out of the way. The tool reads the output through a pipe,
 *   where git does not page, and this makes sure of it.
 *
 * The commands the tool uses (`rev-parse`, `ls-files`, `status`) do not run `diff.external`, a `textconv` filter, or a
 * hook, and open no network connection, so `diff.*`, `core.hooksPath`, `core.sshCommand`, and `credential.helper` have
 * no effect on them. A clean filter (`filter.<name>.clean` with a `filter=<name>` attribute) does run in `git status`
 * for a file whose content has to be compared, as it does for every git command in that repository. It cannot be
 * turned off without marking every file a filter manages (Git LFS, say) as modified, so the README says to run the tool
 * only in a repository you trust.
 */
const GIT_OPTIONS = ['--no-pager', '-c', 'core.fsmonitor=false'];

/**
 * The absolute path of the git program, by the `PATH` it was asked with. `PATH` rarely changes inside a process, and a
 * test changes it, so the answer is kept per value of `PATH` (and `PATHEXT`, `Path`) instead of once for ever.
 *
 * @type {Map<string, Promise<string|null>>}
 */
const gitPaths = new Map();

/**
 * Resolve git from `PATH` once and keep the answer. The lookup never reads the current directory or the project
 * directory: on Windows `execFile('git', ..., { cwd })` can start a `git.exe` that sits in `cwd` before it looks at
 * `PATH`, and the project is code the tool does not trust (see `findExecutable()`).
 *
 * @param {Record<string, string|undefined>} [env] The environment to read `PATH` from. Defaults to `process.env`.
 * @returns {Promise<string|null>} The absolute path, or `null` when no directory of `PATH` holds git.
 */
export function gitExecutable(env = process.env) {
  const key = ['PATH', 'Path', 'PATHEXT'].map(name => `${name}=${env[name] ?? ''}`).join('\0');

  if (!gitPaths.has(key)) {
    gitPaths.set(key, findExecutable('git', { env }));
  }

  return gitPaths.get(key);
}

/**
 * Run git in a directory.
 *
 * @param {string[]} args Git arguments.
 * @param {string} cwd Working directory.
 * @returns {Promise<string>} Standard output.
 * @throws {Error} When git is not on `PATH`, or exits with an error.
 */
async function git(args, cwd) {
  const env = gitEnv();
  const program = await gitExecutable(env);

  if (program === null) {
    throw new GitMissing('git was not found on PATH.');
  }

  const { stdout } = await execFileAsync(program, [...GIT_OPTIONS, ...args], {
    cwd,
    env,
    maxBuffer: 256 * 1024 * 1024,
  });

  return stdout;
}

/**
 * Tell whether a directory is inside a git work tree.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<boolean>} `true` inside a work tree. `false` when no `.git` entry stands at or above the directory
 * and git says it is not a work tree, cannot be started, or is not there.
 * @throws {GitNotFoundError} When there is no git program and a `.git` entry stands at or above the directory.
 * @throws {GitError} When git ran and failed for another reason, with what it said, when it cannot be started or says
 * "not a git repository" while a `.git` entry stands at or above the directory.
 */
export async function isGitRepo(cwd) {
  try {
    return (await git(['rev-parse', '--is-inside-work-tree'], cwd)).trim() === 'true';
  } catch (error) {
    if (error instanceof GitMissing) {
      // No git on PATH: with no repository around, there is nothing to guard. With one, the guard cannot run, and that
      // must not look like a project that has none.
      const directory = await directoryWithGitEntry(cwd);

      if (directory !== null) {
        throw new GitNotFoundError(directory);
      }

      return false;
    }

    // A git that cannot start (a string code such as `EACCES`): there is nothing to guard with, unless a `.git` entry
    // says that a repository is there.
    if (typeof error.code === 'string') {
      const directory = await directoryWithGitEntry(cwd);

      if (directory !== null) {
        throw new GitError(`git could not be started (${error.code}), and ${directory} holds a .git entry.`);
      }

      return false;
    }

    const said = String(error.stderr ?? '').trim();

    // `git rev-parse` exits 128 with this sentence outside a repository, which is no failure. Git says it for a broken
    // repository too (a corrupt `.git/HEAD`, a `GIT_COMMON_DIR` that does not exist), so a `.git` entry at or above
    // the directory turns it into one.
    if (/not a git repository/i.test(said)) {
      const directory = await directoryWithGitEntry(cwd);

      if (directory !== null) {
        throw new GitError(`git says this is not a git repository, but ${directory} holds a .git entry.`);
      }

      return false;
    }

    const lines = said.split(/\r?\n/).filter(Boolean).slice(0, 3);

    throw new GitError(lines.join(' ') || `git exited with code ${error.code}.`);
  }
}

/**
 * The real path of a file, or of its directory plus its name when the file does not exist, so two spellings of one
 * location (a symbolic link in a temporary directory path, say) compare equal.
 *
 * @param {string} path Absolute path.
 * @returns {Promise<string>} The canonical path.
 */
async function canonical(path) {
  try {
    return await realpath(path);
  } catch {
    // The file is not there: its directory still gives the real location.
    return resolve(await realpath(dirname(path)).catch(() => dirname(path)), basename(path));
  }
}

/**
 * List the paths with uncommitted changes under a directory, untracked files included.
 *
 * Untracked files are listed one by one (`--untracked-files=all`), whatever `status.showUntrackedFiles` says: a user who
 * set it to `no` would otherwise get no guard for the new files a migration lands next to.
 *
 * An untracked file listed in `ignoreUntracked` does not count. The caller uses it for the report file the user
 * asked for: a report left in the tree by the previous run would otherwise refuse the next run.
 *
 * @param {string} cwd Directory.
 * @param {object} [options] Options.
 * @param {string[]} [options.ignoreUntracked] Absolute paths of untracked files to leave out.
 * @returns {Promise<string[]>} Porcelain status lines, empty for a clean tree.
 */
export async function dirtyPaths(cwd, { ignoreUntracked = [] } = {}) {
  const output = await git(['status', '--porcelain', '-z', '--untracked-files=all', '--', '.'], cwd);
  const fields = output.split('\0').filter(Boolean);
  const lines = [];
  const top = ignoreUntracked.length > 0 ? (await git(['rev-parse', '--show-toplevel'], cwd)).trim() : null;
  const root = top === null ? null : await canonical(top);
  const ignored = await Promise.all(ignoreUntracked.map(canonical));

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const status = field.slice(0, 2);

    // A rename or copy entry carries the old path as one more field.
    if (/[RC]/.test(status)) {
      index += 1;
    }

    const absolute = root === null ? null : await canonical(resolve(root, field.slice(3)));

    if (!(status === '??' && absolute !== null && ignored.includes(absolute))) {
      lines.push(field);
    }
  }

  return lines;
}

/**
 * List the tracked files under a directory that git is told not to look at, and that exist on disk: marked
 * `assume-unchanged` (`git update-index --assume-unchanged`) or `skip-worktree`. `git status` leaves them out whatever
 * their content, so an edit to one of them passes the clean-tree guard and is not in the diff of the migration.
 * `git ls-files -v` tags them with a lowercase letter or with `S`. A tagged file that is not on disk (a sparse checkout
 * keeps every path outside its cone this way) is no risk, because the tool never reads it.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<Array<{path: string, flag: 'assume-unchanged'|'skip-worktree'}>>} The files, relative to `cwd`.
 */
export async function hiddenPaths(cwd) {
  const output = await git(['ls-files', '-v', '-z', '--', '.'], cwd);
  const hidden = [];

  for (const field of output.split('\0').filter(Boolean)) {
    const tag = field[0];
    const path = field.slice(2);

    if (tag === 'S' || (tag >= 'a' && tag <= 'z')) {
      if (await lstat(resolve(cwd, path)).then(() => true, () => false)) {
        hidden.push({ path, flag: tag === 'S' ? 'skip-worktree' : 'assume-unchanged' });
      }
    }
  }

  return hidden;
}

/**
 * Tell whether git tracks a path.
 *
 * @param {string} cwd Directory inside the work tree.
 * @param {string} path Absolute or `cwd`-relative path.
 * @returns {Promise<boolean>} `true` when the path is in the index.
 */
export async function isTracked(cwd, path) {
  try {
    await git(['ls-files', '--error-unmatch', '--', path], cwd);

    return true;
  } catch {
    // `git ls-files --error-unmatch` exits 1 for a path that is not in the index.
    return false;
  }
}

/**
 * List the files git knows under a directory: tracked, plus untracked files that are not ignored. Paths are
 * relative to `cwd` and use forward slashes.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<string[]>} File paths.
 */
export async function listFiles(cwd) {
  const output = await git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd);

  return output.split('\0').filter(Boolean);
}

/**
 * Tell whether git ignores a path, because a `.gitignore` of this repository or of an outer one names it or a
 * directory above it. A tracked file is never ignored. Nothing is listed under an ignored directory, so a project
 * inside one gets an empty file list.
 *
 * @param {string} cwd Directory inside the work tree.
 * @param {string} [path] Path relative to `cwd`. Defaults to `cwd` itself.
 * @returns {Promise<boolean>} `true` when git ignores the path.
 */
export async function isIgnored(cwd, path = '.') {
  try {
    await git(['check-ignore', '-q', '--', path], cwd);

    return true;
  } catch {
    // `git check-ignore -q` exits 1 for a path that is not ignored, and 128 on an error: neither says "ignored".
    return false;
  }
}
