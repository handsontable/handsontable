module.exports = function headerAnchor(markdown) {
  const insertedTokenTag = 'a';
  const insertedOpenTokenType = 'link_open';
  const insertedCloseTokenType = 'link_close';
  const foundTokenTags = ['h1', 'h2', 'h3'];
  const foundOpenTokenType = 'heading_open';

  const findAndReplace = (state) => {
    const Token = state.Token;
    const relativePath = state.env?.relativePath; // Sometimes the `env` key is an empty object.

    if (relativePath === void 0) {
      return;
    }

    state.tokens.forEach((token, index) => {
      // Check if token is inside `h` tag
      if (
        token.type === 'inline'
        && state.tokens[index - 1].type === foundOpenTokenType
        && foundTokenTags.includes(state.tokens[index - 1].tag)
      ) {
        // Create `a` tag with href attribute
        const aTagOpen = new Token(insertedOpenTokenType, insertedTokenTag, 1);
        const aTagClose = new Token(insertedCloseTokenType, insertedTokenTag, -1);
        const id = state.tokens[index - 1].attrGet('id');

        aTagOpen.attrSet('href', `#${id}`);
        aTagOpen.attrSet('class', 'header-link');

        // Wrap `h` tag content with `a` tag
        token.children.unshift(aTagOpen);
        token.children.push(aTagClose);
      }
    });
  };

  markdown.core.ruler.push('header_anchor', findAndReplace);
};
