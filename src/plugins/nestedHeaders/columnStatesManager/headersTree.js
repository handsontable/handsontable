export default class HeadersTree {
  constructor(nestedHeadersSettings) {
    this.rootNodes = new Map();
    this.headersSettings = nestedHeadersSettings;
  }

  getRoots() {
    return Array.from(this.rootNodes.values());
  }

  buildTree() {
    const columnsCount = this.headersSettings.getColumnsCount();

    let columnIndex = 0;

    while (columnIndex < columnsCount) {
      const columnSettings = this.headersSettings.getColumnSettings(0, columnIndex);
      const rootNode = new NodeStructure({});

      this.rootNodes.set(columnIndex, rootNode);
      this.buildLeaves(rootNode, columnIndex, 0, columnSettings.colspan);

      columnIndex += columnSettings.colspan;
    }
  }

  buildLeaves(parentNode, columnIndex, headerLevel = 0, extractionLength = 1) {
    const columnsSettings = this.headersSettings.getColumnsSettings(headerLevel, columnIndex, extractionLength);

    headerLevel += 1;

    for (let i = 0; i < columnsSettings.length; i++) {
      const columnSettings = columnsSettings[i];
      let node;

      if (headerLevel === 1) {
        parentNode.data = columnSettings;
        node = parentNode;
      } else {
        node = new NodeStructure(columnSettings);

        parentNode.childs.push(node);
      }

      if (headerLevel < this.headersSettings.getLayersCount()) {
        this.buildLeaves(node, columnIndex, headerLevel, columnSettings.colspan);
      }

      columnIndex += columnSettings.colspan;
    }
  }
}

class NodeStructure {
  constructor(data) {
    this.data = data;
    this.childs = [];
  }
}
