/**
 * Matches into: `source-code-link https://github.com/handsontable/handsontable`.
 *
 * @type {RegExp}
 */
const sourceCodeLinkRegex = /^(source-code-link)\s*(\S*)\s*([\S|\s]*)$/;

module.exports = {
  type: 'source-code-link',
  render(tokens, index) {
    const token = tokens[index];

    const [,, href] = token.info.trim().match(sourceCodeLinkRegex) || [];

    if (href) {
      // opening tag
      // eslint-disable-next-line max-len
      return `<a href="${href}" target="_blank" class="source-code-link"> Source code <i class="ico i-external"></i> </a>`;
    }

    return '';
  }
};
