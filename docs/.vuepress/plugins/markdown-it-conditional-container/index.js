const chalk = require('chalk');
const { getEnvDocsFramework, parseFramework, getDefaultFramework, getNormalizedPath } = require('../../helpers');

module.exports = function conditionalContainer(markdown) {
  const openAndCloseTagOneliner = /::: only-for (((react|javascript) ?)+)(.*?):::$/ms;
  const foundOpenTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)(.*?)$/;
  const foundCloseTokenContent = /(?:\n?):::$/;
  const markupForCustomContainer = ':::';
  const capturedGroupIndex = 1;
  let endIndex;

  const removeValue = ({ token, regexp, env }) => {
    // Removing value from token's content.
    token.content = token.content.replace(regexp, '');

    const childrenIndex = token.children.findIndex(
      childrenToken => regexp.test(childrenToken.content));

    // Removing token's children also representing removed value.
    if (childrenIndex !== -1) {
      token.children.splice(childrenIndex, 1);

    } else {
      // eslint-disable-next-line no-console
      console.error(`${chalk.red('\nUnexpected error thrown while removing conditional container' +
        ` Please check how "${env.frontmatter.permalink}" site parsed from ` +
        `"${getNormalizedPath(env.relativePath)}" file looks like.`
      )}`);
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
          removeValue({ token, regexp: foundOpenTokenContent, env });
          removeValue({ token, regexp: foundCloseTokenContent, env });
        }

      } else if (isNotNativeContainer && foundCloseTokenContent.test(token.content)) {

        endIndex = index;
      } else if (isNotNativeContainer && foundOpenTokenContent.test(token.content)) {
        const onlyForFrameworks = foundOpenTokenContent.exec(token.content)[capturedGroupIndex].split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          const indexAfterCurrentToken = index + 1;

          state.tokens.splice(indexAfterCurrentToken, endIndex - indexAfterCurrentToken + 1);
        } else {
          removeValue({ token, regexp: foundCloseTokenContent, env });
        }

        removeValue({ token, regexp: foundOpenTokenContent, env });
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
