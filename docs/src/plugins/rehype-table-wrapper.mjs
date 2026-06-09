/**
 * Rehype plugin that wraps every <table> element in a
 * <div class="table-container"> for horizontal scrolling on narrow viewports.
 * Mirrors the VuePress markdown-it-table-wrapper plugin.
 */
import { visit } from 'unist-util-visit';

export function rehypeTableWrapper() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || parent == null || index == null) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-container'] },
        children: [node],
      };
    });
  };
}
