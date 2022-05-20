const {
  getDefaultFramework
} = require('../../helpers');
const { getContainerFramework } = require('../helpers');

/**
 * When using nested containers (for example, `::: example` inside `::: only-for`, Vuepress mistakenly treats the
 * closing `:::` markup as an actual paragraph, this method removes it.
 *
 * @param {object[]} tokens Array of tokens.
 * @param {number} closingContainerIndex Index of the closing element of he `only-for` container.
 * @returns {object[]}
 */
function removeLeftoverMarkup(tokens, closingContainerIndex) {
  if (
    tokens[closingContainerIndex].markup === ':::' &&
    tokens[closingContainerIndex + 2].content === ':::'
  ) {
    tokens.splice(closingContainerIndex + 1, 3);
  }

  return tokens;
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Container used to display/hide blocks of content relevant to specific frameworks.
 * It relies on providing the framework name(s) as arguments to the container (see 'Usage' below) and setting a
 * `DOCS_FRAMEWORK` environmental variable as the framework name, for example:
 *
 * ```
 * DOCS_FRAMEWORK=react
 * ```
 *
 * Usage:
 * ```
 * ::: only-for react
 * Content to be displayed only for React documentation.
 * :::
 *
 * ::: only-for javascript react vue
 * Content to be displayed only for JS, React and Vue documentation.
 * :::
 * ```
 *
 * **NOTE:** When using this container to conditionally display another container (like `::: example`), use a
 * separate `only-for` for EACH of the containers.
 */
module.exports = {
  type: 'only-for',
  render(tokens, index, opts, env) {
    const framework = getContainerFramework(env.relativePath) || getDefaultFramework();
    const args = tokens[index].info.trim().split(' ');

    if (tokens[index].nesting === 1 && !args.includes(framework)) {
      const firstBlockTokenIndex = index + 1;
      let lastBlockTokenIndex = firstBlockTokenIndex;

      while (tokens[lastBlockTokenIndex + 1].markup !== ':::') {
        lastBlockTokenIndex += 1;
      }

      tokens.splice(firstBlockTokenIndex, lastBlockTokenIndex - firstBlockTokenIndex + 1);

    } else {
      tokens = removeLeftoverMarkup(tokens, index);
    }

    return '';
  }
};
