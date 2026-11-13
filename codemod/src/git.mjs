import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Environment for git child processes. A run started from inside a git hook inherits `GIT_DIR` and friends,
 * which would point git at the hook's repository instead of the project.
 *
 * @returns {NodeJS.ProcessEnv} A copy of `process.env` without the repository-selecting variables.
 */
function gitEnv() {
  const env = { ...process.env };

  ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX'].forEach(name => delete env[name]);

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
 * Run git in a directory.
 *
 * @param {string[]} args Git arguments.
 * @param {string} cwd Working directory.
 * @returns {Promise<string>} Standard output.
 */
async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', [...GIT_OPTIONS, ...args], {
    cwd,
    env: gitEnv(),
    maxBuffer: 256 * 1024 * 1024,
  });

  return stdout;
}

/**
 * Tell whether a directory is inside a git work tree.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<boolean>} `true` inside a work tree. `false` when not, or when git is missing.
 */
export async function isGitRepo(cwd) {
  try {
    return (await git(['rev-parse', '--is-inside-work-tree'], cwd)).trim() === 'true';
  } catch {
    // Not a repository, or git is not installed: both mean there is no tree to guard.
    return false;
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
 * An untracked file listed in \`ignoreUntracked\` does not count. The caller uses it for the report file the user
 * asked for: a report left in the tree by the previous run would otherwise refuse the next run.
 *
 * @param {string} cwd Directory.
 * @param {object} [options] Options.
 * @param {string[]} [options.ignoreUntracked] Absolute paths of untracked files to leave out.
 * @returns {Promise<string[]>} Porcelain status lines, empty for a clean tree.
 */
export async function dirtyPaths(cwd, { ignoreUntracked = [] } = {}) {
  const output = await git(['status', '--porcelain', '-z', '--', '.'], cwd);
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
