/**
 * A factory for creating function for `markdown-it-anchor` plugin's `permalinkSymbol` configuration option.
 *
 * @param {Set} uniqueSlugs An unique set, where are stored slugs. 
 * @returns {function}
 */
function getPermalinkHrefMethod(uniqueSlugs) {
  return function(slug, state) {
    const slugify = state.md.slugify;
    const openTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)\n?/;
    const closeTokenContent = /(?:\n?):::(?:\n?)$/;
    const markupForCustomContainer = ':::';
    const headerOpenType = 'heading_open';
    const headerCloseType = 'heading_close';
    let endIndex;

    if (/(.*)-(\d)+$/.test(slug) === false) {
      return `#${slug}`;
    }

    const handleTokensInsideOnlyForContainer = (action) => {
      for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
        const token = state.tokens[index];
        // We don't create custom container intentionally inside `markdown-it-conditional-container` plugin.
        const isNotNativeContainer = token.markup !== markupForCustomContainer;

        if (isNotNativeContainer) {
          if (closeTokenContent.test(token.content)) {

            endIndex = index;
          } else if (openTokenContent.test(token.content)) {
            action(state.tokens.slice(index, endIndex));
          }
        }
      }
    };

    const getTokensInsideHeaders = (tokens) => {
      return tokens.filter((_, tokenIndex) => {
        if (tokenIndex === 0 || tokenIndex === tokens.length - 1) {
          return false;

        } else if (tokens[tokenIndex - 1]?.type === headerOpenType &&
          tokens[tokenIndex + 1]?.type === headerCloseType) {
          // Tokens being children of some header.
          return true;
        }

        return false;
      });
    };

    const getParsedSlugsFromHeaders = (tokens) => {
      return getTokensInsideHeaders(tokens).map(headerContentTag => slugify(headerContentTag.content));
    };

    const parseAndChangeDuplicatedSlug = (tokensInside) => {
      getParsedSlugsFromHeaders(tokensInside).some((headerSlug) => { // Array.some for purpose of stopping the loop.
        const headerSlugWithNumber = new RegExp(`${headerSlug}-(\\d)+$`);

        if (headerSlugWithNumber.test(slug)) {
          // Remove the `-[number]` suffix from the permalink href attribute.
          const duplicatedSlugsMatch = headerSlugWithNumber.exec(slug);

          if (duplicatedSlugsMatch) {
            // Updating a set of slugs, which will be used by another method.
            uniqueSlugs.add(headerSlug);

            // Removed the `-[number]` suffix.
            slug = `${headerSlug}`;

            return true; // Breaks the loop.
          }
        }

        return false; // Continue looping.
      });
    };

    handleTokensInsideOnlyForContainer(parseAndChangeDuplicatedSlug);

    return `#${slug}`;
  }
}

module.exports = {
  getPermalinkHrefMethod,
}
