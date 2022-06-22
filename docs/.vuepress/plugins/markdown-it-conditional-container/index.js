const chalk = require('chalk');
const { getEnvDocsFramework, parseFramework, getDefaultFramework, getNormalizedPath } = require('../../helpers');

module.exports = function conditionalContainer(markdown) {
  const openAndCloseTagOneliner = /::: only-for (((react|javascript) ?)+)(.*?):::$/ms;
  const foundOpenTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)(.*?)$/;
  const foundCloseTokenContent = /\n:::$/;
  const markupForCustomContainer = ':::';
  const capturedGroupIndex = 1;
  let endIndex;

  const findAndRemove = (state) => {
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const frameworkId = getEnvDocsFramework() || parseFramework(relativePath) || getDefaultFramework();

    for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
      const token = state.tokens[index];
      // We don't create custom container intentionally. It can create paragraphs or break listed elements.
      const isNotNativeContainer = token.markup !== markupForCustomContainer;

      if (isNotNativeContainer && openAndCloseTagOneliner.test(token.content)) {
        const onlyForFrameworks = openAndCloseTagOneliner.exec(token.content)[capturedGroupIndex].split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          state.tokens.splice(index, 1);
        }

      } else if (isNotNativeContainer && foundCloseTokenContent.test(token.content)) {

        endIndex = index;
      } else if (isNotNativeContainer && foundOpenTokenContent.test(token.content)) {
        const onlyForFrameworks = foundOpenTokenContent.exec(token.content)[capturedGroupIndex].split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          const indexAfterCurrentToken = index + 1;

          state.tokens.splice(indexAfterCurrentToken, endIndex - indexAfterCurrentToken + 1);
          // Removing value from token's content.
          token.content = token.content.replace(foundOpenTokenContent, '');

          const childrenIndex = token.children.findIndex(
            childrenToken => foundOpenTokenContent.test(childrenToken.content));

          // Removing token's children also representing removed value.
          if (childrenIndex !== -1) {
            token.children.splice(childrenIndex, 1);

          } else {
            // eslint-disable-next-line no-console
            console.error(`${chalk.red('\nUnexpected error for removing conditional container ("markdown-it" plugin).' +
              ` Please check how "${state.env.frontmatter.permalink}" site parsed from ` +
              `"${getNormalizedPath(relativePath)}" file looks like.`
            )}`);
          }
        }
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
