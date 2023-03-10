import psTree from 'ps-tree';
import { promisify } from 'util';
import execa from 'execa';
import { BASE_BRANCH, REFERENCE_FRAMEWORK, WRAPPERS } from '../../src/config.mjs';

const psTreePromisified = promisify(psTree);

/**
 * Returns a Promise that's resolved after the specified number of milliseconds.
 *
 * @param {number} [delay=100] The delay after which the Promise is resolved (in milliseconds).
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
 * Returns the name of the current branch.
 *
 * @returns {string}
 */
export function getCurrentBranchName() {
  return process.env.GITHUB_REF_NAME ||
    execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;
}

/**
 * Returns `true` if tests are run on the reference branch (`develop`).
 *
 * @returns {boolean}
 */
export function isReferenceBranch() {
  return getCurrentBranchName() === BASE_BRANCH;
}

/**
 * Returns a list of frameworks to be tested,
 * depending on which branch the scripts are run on.
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
 * @param {number} pid The ID of the process to kill.
 * @param {string} [signal='SIGKILL'] The type of the signal to send.
 */
export async function killProcess(pid, signal = 'SIGKILL') {
  const pids = await psTreePromisified(pid);

  pids.forEach(({ PID }) => {
    process.kill(PID, signal);
  });

  process.kill(pid, signal);
}
