const chalk = require('chalk');
const { getEnvDocsFramework, parseFramework, getDefaultFramework, getNormalizedPath } = require('../../helpers');

/* eslint-disable */
/**
 * Container used to display blocks of content only for to specific frameworks.
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
  const openAndCloseTagOneliner = /::: only-for (((react|javascript) ?)+)(.*?):::$/ms; // It is multi line text.
  const openTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)\n?/;
  const fullMatchOpenToken = /^(?:\n?)::: only-for (((react|javascript) ?)+)\n?$/;
  const closeTokenContent = /(?:\n?):::(?:\n?)$/;
  const fullMatchCloseToken = /^(?:\n?):::(?:\n?)$/;
  const markupForCustomContainer = ':::';
  const newLineTokenType = 'softbreak';
  const capturedGroupIndex = 1;
  let endIndex;

  const removeValueAndNewLine = ({ token, regexp, env }) => {
    // Removing value from token's content.
    token.content = token.content.replace(regexp, '');

    // Some tokens may not have children. Children are component parts of the displayed text in most cases.
    if (token.children === null) {
      return;
    }

    let childrenIndex = token.children.findIndex(childrenToken => regexp.test(childrenToken.content));

    // Some tokens contains children which also represents the removed value (and they are displayed in the output file).
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
      console.error(`${chalk.red('\nUnexpected error while processing a conditional container (::: only-for) in the file ' 
        `"${getNormalizedPath(env.relativePath)}".` +
        ` Please check the file or the resulting page "${env.frontmatter.permalink}".`
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
      
      if (isNotNativeContainer) {
        if (openAndCloseTagOneliner.test(token.content)) {
          const onlyForFrameworks = openAndCloseTagOneliner.exec(token.content)[capturedGroupIndex].split(' ');

          if (onlyForFrameworks.includes(frameworkId) === false) {
            state.tokens.splice(index, 1); // We remove full token containing oneliner.

          } else {
            removeValueAndNewLine({ token, regexp: openTokenContent, env });
            removeValueAndNewLine({ token, regexp: closeTokenContent, env });
          }

        } else if (closeTokenContent.test(token.content)) {

          endIndex = index;
        } else if (openTokenContent.test(token.content)) {
          const onlyForFrameworks = openTokenContent.exec(token.content)[capturedGroupIndex].split(' ');

          if (endIndex === void 0) {
            console.error(`${chalk.red('\nUnexpected error while processing a conditional container (::: only-for)' +
              ` in the file "${getNormalizedPath(env.relativePath)}". It seems that the opening token (::: only-for)` +
              ' exists, but the ending token (:::) does not.'
            )}`);
          }

          if (onlyForFrameworks.includes(frameworkId) === false) {
            const startIndexForRemoval = index + 1; // We remove elements, starting from the token right after the found one.
            const elementsForRemoval = endIndex - startIndexForRemoval + 1;

            state.tokens.splice(startIndexForRemoval, elementsForRemoval);

            // Token's content may starts with the opening token (::: only-for). It should be removed completely then.
            // Starting from the opening token (::: only-for) no value should be shown. Alternatively,
            // the opening token can be placed at the end of the string (that's how the MD file is tokenized when there
            // is a newline adjacent to ::: markup). Then, characters until the opening token occurs,
            // should be preserved. Just string's tail should be removed.
            cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: /^::: only-for/, env });

          } else {
            // Removing / replacing elements from the end (:::) to the start (:::: only-for).
            cleanTokens({ tokens: state.tokens, token: state.tokens[endIndex], tokenIndex: endIndex, lessPreciseRegexp: closeTokenContent, preciseRegexp: fullMatchCloseToken, env  });
            cleanTokens({ tokens: state.tokens, token, tokenIndex: index, lessPreciseRegexp: openTokenContent, preciseRegexp: fullMatchOpenToken, env });
          }
        }
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
