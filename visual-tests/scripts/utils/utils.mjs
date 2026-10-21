import { promisify } from 'util';
import psTree from 'ps-tree';
import execa from 'execa';
import { resolveTier } from '../../lib/visual-tiers.mjs';

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
 * Returns the tier this run renders and compares: `VISUAL_TIER` when set, else by branch
 * (`lib/visual-tiers.mjs`). `build.mjs`, `run-tests.mjs` and both comparison scripts resolve it
 * through this one call, so they cannot disagree about what a build contains.
 *
 * @returns {object} The resolved tier.
 */
export function getTier() {
  return resolveTier(process.env, { currentBranch: getCurrentBranchName });
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
