/**
 * Matches into: `example #ID .class :preset --html 0 --js 1 --hidden`.
 *
 * @type {RegExp}
 */
const exampleRegex = /^(source-code-link)\s*(\S*)\s*([\S|\s]*)$/;

module.exports = {
  type: 'source-code-link',
  render(tokens, index) {
    const token = tokens[index];

    const [,, href] = token.info.trim().match(exampleRegex) || [];

    if (href) {
      // opening tag
      return `<a href="${href}" target="_blank" class="source-code-link"> Source code <OutboundLink /> </a>`;
    }

    return '';
  }
};
