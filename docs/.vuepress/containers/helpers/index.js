const {
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
  // Compensation for the frontmatter syntax not being part of the data definition.
  // Namely:
  // - The upper and lower "---" (2 lines)
  // - A newline below the entire section (1 line)
  const frontMatterSyntaxOffset = 3;

  const frontMatterEntriesCount = Object.keys(frontMatterObj).reduce(
    (lineCount, key) => {
      if (Array.isArray(frontMatterObj[key])) {
        return lineCount + frontMatterObj[key].length + 1;
      }

      return lineCount + 1;
    }, 0);

  return frontMatterEntriesCount + frontMatterSyntaxOffset;
}

/**
 *  * Given the `.md` file path retrieves the framework name used to do the snippet transformation.
 *
 * @param {string} path The `.md` file path.
 * @returns {string} The framework name.
 */
function getContainerFramework(path) {
  return parseFramework(path);
}

module.exports = {
  getContainerFrontMatterLength,
  getContainerFramework
};
