const chalk = require('chalk');
const { getEnvDocsFramework, parseFramework, getDefaultFramework, getNormalizedPath } = require('../../helpers');

/* eslint-disable */
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
 */
module.exports = function conditionalContainer(markdown) {
  const openAndCloseTagOneliner = /::: only-for (((react|javascript) ?)+)(.*?):::$/ms;
  const openTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)\n?/;
  const fullMatchOpenToken = /^(?:\n?)::: only-for (((react|javascript) ?)+)\n?$/;
  const closeTokenContent = /(?:\n?):::$/;
  const fullMatchCloseToken = /^(?:\n?):::$/;
  const markupForCustomContainer = ':::';
  const newLineTokenType = 'softbreak';
  const capturedGroupIndex = 1;
  let endIndex;

  const removeValueAndNewLine = ({ token, regexp, env }) => {
    // Removing value from token's content.
    token.content = token.content.replace(regexp, '');

    let childrenIndex = token.children.findIndex(childrenToken => regexp.test(childrenToken.content));

    // Removing token's children also representing removed value.
    if (childrenIndex !== -1) {
      const nextElement = token.children[childrenIndex + 1];
      const previousElement = token.children[childrenIndex - 1];
      let howMany = 1;

      if (childrenIndex > 0 && previousElement.type === newLineTokenType) {
        childrenIndex -= 1;
        howMany += 1;
      }

      if (nextElement?.type === newLineTokenType) {
        howMany += 1;
      }

      token.children.splice(childrenIndex, howMany);
    } else {
      // eslint-disable-next-line no-console
      console.error(`${chalk.red('\nUnexpected error thrown while removing conditional container' +
        ` Please check how "${env.frontmatter.permalink}" site, parsed from ` +
        `"${getNormalizedPath(env.relativePath)}" file looks like.`
      )}`);
    }
  };
  
  const cleanTokens = ({ tokens, token, tokenIndex, preciseRegexp, lessPreciseRegexp, env }) => {
    if (preciseRegexp.test(token.content)) {
      tokens.splice(tokenIndex, 1);

    } else {
      removeValueAndNewLine({ token, regexp: lessPreciseRegexp, env });
    }
  };

  const findAndRemove = (state) => {
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const env = state.env;
    const frameworkId = getEnvDocsFramework() || parseFramework(relativePath) || getDefaultFramework();

    for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
      const token = state.tokens[index];
      // We don't create custom container intentionally. It can create paragraphs or break listed elements.
      const isNotNativeContainer = token.markup !== markupForCustomContainer;

      if (isNotNativeContainer && openAndCloseTagOneliner.test(token.content)) {
        const onlyForFrameworks = openAndCloseTagOneliner.exec(token.content)[capturedGroupIndex].split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          state.tokens.splice(index, 1);

        } else {
          cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: fullMatchOpenToken, env });
          cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: closeTokenContent, preciseRegexp: fullMatchCloseToken, env });
        }

      } else if (isNotNativeContainer && closeTokenContent.test(token.content)) {

        endIndex = index;
      } else if (isNotNativeContainer && openTokenContent.test(token.content)) {
        const onlyForFrameworks = openTokenContent.exec(token.content)[capturedGroupIndex].split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          let indexForRemoval = index;

          if (/^::: only-for/.test(token.content) === false) {
            indexForRemoval += 1;

          } else {
            cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: fullMatchOpenToken, env });
          }

          state.tokens.splice(indexForRemoval, endIndex - indexForRemoval + 2);
        } else {
          cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: fullMatchOpenToken, env });
          cleanTokens({ tokens: state.tokens, token: state.tokens[endIndex], tokenIndex: endIndex, lessPreciseRegexp: closeTokenContent, preciseRegexp: fullMatchCloseToken, env  });
        }
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
