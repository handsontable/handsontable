const path = require('path');
const fsExtra  = require('fs-extra');

/**
 * Get the closest existing to the provided relative path.
 * This function checks if the provided path exist - if not, it goes a level deeper in the file tree, until it finds
 * an existing directory or reaches the maximum depth, configured by the `maxDepth` argument.
 *
 * @param {string} relativePath Relative path to be checked.
 * @param {boolean} [testOffset] If set to `true`, the relative path will be moved up one level in the file tree, to
 * compensate for the test suite HTML location.
 * @param {number} [maxDepth=2] Maximum tree depth.
 * @returns {string|undefined} Returns the found path or `undefined`, if the path doesn't exist.
 */
function getClosest(relativePath, testOffset, maxDepth = 2) {
  let level = 0;

  while (level < maxDepth) {
    const pathToCheck = testOffset ? relativePath.replace('../', '') : relativePath;

    if (fsExtra.pathExistsSync(pathToCheck)) {
      return relativePath;
    }

    relativePath = `../${relativePath}`;

    level++;
  }
}

/**
 * Prefixes `../` onto a relative asset path so it still resolves correctly
 * when the generated HTML lives one directory deeper than the "canonical"
 * `test/E2ERunner.html`. Absolute paths are returned unchanged.
 *
 * Used when the JasmineHtml plugin emits a per-run runner into `test/dist/`
 * while the original asset paths were authored for `test/`.
 *
 * @param {string} assetPath
 * @returns {string}
 */
function rewriteAssetPath(assetPath) {
  if (path.isAbsolute(assetPath)) {
    return assetPath;
  }

  return `../${assetPath}`;
}

module.exports = {
  getClosest,
  rewriteAssetPath,
};
