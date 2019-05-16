import NodesPool from './../utils/nodesPool';

export default class BaseRenderer {
  constructor(nodeType = null, rootNode = null) {
    // NodePool should be used for each renderer. For the first stage, only some of the
    // renderers are refactored to the new implementation.
    this.nodesPool = typeof nodeType === 'string' ? new NodesPool(nodeType) : null;
    this.rootNode = rootNode;
    this.table = null;
    this.renderedNodes = 0;
  }

  setTable(table) {
    if (this.nodesPool) {
      this.nodesPool.setRootDocument(table.rootDocument);
    }

    this.table = table;
  }

  adjust() { }
  render() { }
}
