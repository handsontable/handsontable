/**
 * TODO, before merging: docs
 * @param tree
 */
function includeSelfClosingTags(node, rawHtml) {
  // Workaround for an issue with `node-html-parser`
  // https://github.com/taoqf/node-html-parser/issues/178
  node.childNodes.forEach((childNode) => {
    includeSelfClosingTags(childNode, rawHtml);
  });

  if (rawHtml.slice(...node.range).endsWith('/>')) {
    node.toString = function() {
      const tag = this.rawTagName;

      if (tag) {
        const attrs = this.rawAttrs ? ` ${this.rawAttrs}` : '';

        return this.isVoidElement ? `<${tag}${attrs}/>` : `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
      }

      return this.innerHTML;
    };
  }

  return node;
}

module.exports = {
  includeSelfClosingTags
};
