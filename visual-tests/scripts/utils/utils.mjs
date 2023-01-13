import execa from 'execa';

/**
 * Gets the working space current branch name.
 *
 * @returns {string}
 */
export function getCurrentBranchName() {
  return process.env.GITHUB_REF_NAME ||
    execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;
}

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
