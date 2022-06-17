const { getEnvDocsFramework, parseFramework } = require('../../helpers');

module.exports = function conditionalContainer(markdown) {
  const foundOpenTokenType = 'container_only-for_open';
  const foundCloseTokenType = 'container_only-for_close';
  let endIndex;
  let startIndex;

  const findAndRemove = (state) => {
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const frameworkId = getEnvDocsFramework() || parseFramework(relativePath);

    if (frameworkId === void 0) {
      return;
    }

    for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
      const token = state.tokens[index];

      if (token.type === foundCloseTokenType) {
        endIndex = index;
      }

      if (token.type === foundOpenTokenType) {
        startIndex = index;

        state.tokens.splice(startIndex, endIndex - startIndex + 1);
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
