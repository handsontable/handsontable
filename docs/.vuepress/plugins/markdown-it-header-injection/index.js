const { getPrettyFrameworkName, parseFramework } = require('../../helpers');

module.exports = function firstHeaderInjection(markdown) {
  const insertedTokenTag = 'span';
  const insertedOpenTokenType = 'paragraph_open';
  const insertedCloseTokenType = 'paragraph_close';
  const foundTokenTag = 'h1';
  const foundOpenTokenType = 'heading_open';

  const findAndInject = (state) => {
    const Token = state.Token;
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    const frameworkId = parseFramework(relativePath);

    if (frameworkId === void 0) {
      return;
    }

    let insertSpan = false;

    // Find the first header and insert some element to it.
    state.tokens.every((token) => {
      // Next token represents a place where new HTML tag can be injected.
      if (insertSpan && token.type === 'inline') {
        const spanOpen = new Token(insertedOpenTokenType, insertedTokenTag, 1);
        const spanClose = new Token(insertedCloseTokenType, insertedTokenTag, -1);
        const text = new Token('html_block', '', 0);

        text.content = `${getPrettyFrameworkName(frameworkId)} Data Grid`;

        spanOpen.attrSet('class', 'header-framework');
        token.children.unshift(spanOpen, text, spanClose); // Add HTML element right after first `h1` tag on the site.

        return false; // Stops the iteration.
      }

      if (token.type === foundOpenTokenType && token.tag === foundTokenTag) {
        insertSpan = true;
      }

      return true;
    });
  };

  markdown.core.ruler.push('first_header_injection', findAndInject);
};
