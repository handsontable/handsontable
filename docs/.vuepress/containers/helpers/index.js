/**
 * Given the frontmatter object available in the Vuepress containers, returns the number of lines the frontmatter is
 * taking in the original `.md` file.
 *
 * @param {object} frontMatterObj Frontmatter information object passed to the Vuepress' `env` argument.
 * @returns {number} The number of lines taken by the frontmatter.
 */
function getFrontMatterLength(frontMatterObj) {
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

module.exports = {
  getFrontMatterLength
}
