const {
  getEnvDocsFramework,
  parseFramework
} = require('../../helpers');

/**
 * Given the frontmatter object available in the Vuepress containers, returns the number of lines the frontmatter is
 * taking in the original `.md` file.
 *
 * @param {object} frontMatterObj Frontmatter information object passed to the Vuepress' `env` argument.
 * @returns {number} The number of lines taken by the frontmatter.
 */
function getContainerFrontMatterLength(frontMatterObj) {
  const frontMatterEntriesCount = Object.keys(frontMatterObj).reduce(
    (sum, key) => {
      if (Array.isArray(frontMatterObj[key])) {
        return sum + frontMatterObj[key].length + 1;
      }

      return sum + 1;
    }, 0);

  // Adding `3` to compensate for the frontmatter syntax.
  return frontMatterEntriesCount + 3;
}

/**
 *  * Given the `.md` file path retrieves the framework name used to do the snippet transformation.
 *
 * @param {string} path The `.md` file path.
 * @returns {string} The framework name.
 */
function getContainerFramework(path) {
  const envFramework = getEnvDocsFramework();

  if (envFramework) {
    return envFramework;
  }

  return parseFramework(path);
}

module.exports = {
  getContainerFrontMatterLength,
  getContainerFramework
};
