import ViewDiffer from './viewDiffer';

export default class OrderView {
  constructor(rootNode, nodesPool) {
    this.rootNode = rootNode;
    this.nodesPool = nodesPool;
    this.viewDiffer = new ViewDiffer();

    this.collectedNodes = [];
    this.staleNodeIndexes = [];
    this.leads = [];
  }

  setSize(size) {
    this.viewDiffer.setSize(size);

    return this;
  }

  setOffset(offset) {
    this.viewDiffer.setOffset(offset);

    return this;
  }

  hasStaleContent(sourceIndex) {
    return this.staleNodeIndexes.includes(sourceIndex);
  }

  getNode(visualIndex) {
    return visualIndex < this.collectedNodes.length ? this.collectedNodes[visualIndex] : null;
  }

  getCurrentNode() {
    const length = this.collectedNodes.length;

    return length > 0 ? this.collectedNodes[length - 1] : null;
  }

  start() {
    // @TODO(perf-tip): If view axis position doesn't change (scroll in a different direction) this can be
    // optimized by reusing previously collected nodes.
    this.collectedNodes.length = 0;
    this.staleNodeIndexes.length = 0;
    this.leads = this.viewDiffer.diff();
  }

  render() {
    this.applyCommand(this.leads.shift());
  }

  applyCommand(command) {
    const { rootNode, collectedNodes } = this;
    const [name, nodeIndex, nodePrevIndex, nodeIndexToRemove] = command;
    const node = this.nodesPool(nodeIndex);

    collectedNodes.push(node);

    // Only nodes which are first time rendered (hasn't any inner content) mark as stale.
    if (name !== 'none' && !node.firstChild) {
      this.staleNodeIndexes.push(nodeIndex);
    }

    switch (name) {
      case 'prepend':
        rootNode.insertBefore(node, rootNode.firstChild);
        break;
      case 'append':
        rootNode.appendChild(node);
        break;
      case 'insert_before':
        rootNode.insertBefore(node, this.nodesPool(nodePrevIndex));
        // To keep the constant length of child nodes (after inserting a node) remove the last child.
        rootNode.removeChild(this.nodesPool(nodeIndexToRemove));
        break;
      case 'replace':
        rootNode.replaceChild(node, this.nodesPool(nodePrevIndex));
        break;
      case 'remove':
        rootNode.removeChild(node);
        break;
      default:
        break;
    }
  }

  end() {
    while (this.leads.length > 0) {
      this.applyCommand(this.leads.shift());
    }
  }
}
