import { arrayEach } from '../../../helpers/array';
import { TreeNode } from '../../../utils/dataStructures/tree';

export default class HeadersTree {
  #rootNodes = new Map();
  #headersSettings;

  constructor(nestedHeadersSettings) {
    this.#headersSettings = nestedHeadersSettings;
  }

  getRoots() {
    return Array.from(this.#rootNodes.values());
  }

  getRootByColumn(visualColumnIndex) {
    return this.#rootNodes.get(visualColumnIndex) ?? null;
  }

  clear() {
    this.#rootNodes.clear();
  }

  buildTree() {
    const columnsCount = this.#headersSettings.getColumnsCount();

    let columnIndex = 0;

    while (columnIndex < columnsCount) {
      const columnSettings = this.#headersSettings.getColumnSettings(0, columnIndex);
      const rootNode = new TreeNode({});

      this.#rootNodes.set(columnIndex, rootNode);
      this.buildLeaves(rootNode, columnIndex, 0, columnSettings.colspan);

      columnIndex += columnSettings.colspan;
    }
  }

  buildLeaves(parentNode, columnIndex, headerLevel = 0, extractionLength = 1) {
    const columnsSettings = this.#headersSettings.getColumnsSettings(headerLevel, columnIndex, extractionLength);

    headerLevel += 1;

    arrayEach(columnsSettings, (columnSettings) => {
      let node;

      if (headerLevel === 1) {
        parentNode.data = {
          headerLevel: headerLevel - 1,
          ...columnSettings,
        };
        node = parentNode;
      } else {
        node = new TreeNode({
          headerLevel: headerLevel - 1,
          ...columnSettings,
        });

        parentNode.childs.push(node);
      }

      if (headerLevel < this.#headersSettings.getLayersCount()) {
        this.buildLeaves(node, columnIndex, headerLevel, columnSettings.colspan);
      }

      columnIndex += columnSettings.colspan;
    });
  }
}
