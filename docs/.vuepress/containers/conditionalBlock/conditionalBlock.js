const {
  getDefaultFramework
} = require('../../helpers');
const { getContainerFramework } = require('../helpers');

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Container used to display/hide blocks of content relevant to specific frameworks.
 * It relies on providing the framework name(s) as arguments to the container (see 'Usage' below) and setting a
 * `FRAMEWORK` environmental variable as the framework name, for example:
 *
 * ```
 * FRAMEWORK=react
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
    }

    return '';
  }
};
