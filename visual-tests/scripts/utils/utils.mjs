import psTree from 'ps-tree';
import { promisify } from 'util';
import execa from 'execa';
import { BASE_BRANCH, REFERENCE_FRAMEWORK, WRAPPERS } from '../../src/config.mjs';

const psTreePromisified = promisify(psTree);

/**
 * Returns a Promise which is resolved after some milliseconds.
 *
 * @param {number} [delay=100] The delay in ms after which the Promise is resolved.
 * @returns {Promise}
 */
export function sleep(delay = 100) {
  return Promise.resolve({
    then(resolve) {
      setTimeout(resolve, delay);
    }
  });
}

/**
 * Gets the current branch name.
 *
 * @returns {string}
 */
export function getCurrentBranchName() {
  return process.env.GITHUB_REF_NAME ||
    execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;
}

/**
 * Checks if tests are run on the base/reference branch.
 *
 * @returns {boolean}
 */
export function isReferenceBranch() {
  return getCurrentBranchName() === BASE_BRANCH;
}

/**
 * Returns list of the frameworks that should be tested. The list differs depends on that branch the
 * scripts are currently run.
 *
 * @returns {string[]}
 */
export function getFrameworkList() {
  if (isReferenceBranch()) {
    return [REFERENCE_FRAMEWORK];
  }

  return [REFERENCE_FRAMEWORK, ...WRAPPERS];
}

/**
 * Kills the main process and all its children.
 *
 * @param {number} pid The process id to kill.
 * @param {string} [signal='SIGKILL'] The signal type to send.
 */
export async function killProcess(pid, signal = 'SIGKILL') {
  const pids = await psTreePromisified(pid);

  pids.forEach(({ PID }) => {
    process.kill(PID, signal);
  });

  process.kill(pid, signal);
}
