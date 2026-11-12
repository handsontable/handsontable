import { execFile } from 'node:child_process';
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
 * Run git in a directory.
 *
 * @param {string[]} args Git arguments.
 * @param {string} cwd Working directory.
 * @returns {Promise<string>} Standard output.
 */
async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd, env: gitEnv(), maxBuffer: 256 * 1024 * 1024 });

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
 * List the paths with uncommitted changes under a directory, untracked files included.
 *
 * @param {string} cwd Directory.
 * @returns {Promise<string[]>} Porcelain status lines, empty for a clean tree.
 */
export async function dirtyPaths(cwd) {
  const output = await git(['status', '--porcelain', '--', '.'], cwd);

  return output.split('\n').filter(Boolean);
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
