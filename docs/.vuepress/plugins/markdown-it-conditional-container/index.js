const { getEnvDocsFramework, parseFramework, getDefaultFramework } = require('../../helpers');

module.exports = function conditionalContainer(markdown) {
  const foundOpenTokenType = 'container_only-for_open';
  const foundCloseTokenType = 'container_only-for_close';
  let endIndex;

  const findAndRemove = (state) => {
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const frameworkId = getEnvDocsFramework() || parseFramework(relativePath) || getDefaultFramework();

    for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
      const token = state.tokens[index];

      if (token.type === foundCloseTokenType) {
        endIndex = index;
      }

      if (token.type === foundOpenTokenType) {
        const onlyForFrameworks = token.info.replace(/\s*only-for /, '').split(' ');

        if (onlyForFrameworks.includes(frameworkId) === false) {
          state.tokens.splice(index, endIndex - index + 1);
        }
      }
    }
  };

  markdown.core.ruler.push('conditional_container', findAndRemove);
};
