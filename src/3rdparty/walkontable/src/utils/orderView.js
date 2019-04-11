import NodesPool from './nodesPool';
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

  setRootNode(rootNode) {
    this.rootNode = rootNode;

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

  start(is) {
    // @TODO(perf-tip): If view axis position doesn't change this can be optimized to reuse previously collected nodes.
    this.collectedNodes.length = 0;
    this.staleNodeIndexes.length = 0;

    this.leads = this.viewDiffer.diff();

    this.is = is;

    if (this.is) {
      // console.log(
      //   'START', this.leads.toString(),
      //   'CURRENT', this.viewDiffer.currentOffset, this.viewDiffer.currentViewSize,
      //   'NEXT', this.viewDiffer.nextOffset, this.viewDiffer.nextViewSize,
      // );
    }
  }

  render() {
    this.applyCommand(this.leads.shift());
  }

  applyCommand(command) {
    const { rootNode, collectedNodes } = this;
    const [ name, nodeIndex, nodePrevIndex, nodeIndexToRemove ] = command;
    const node = this.nodesPool(nodeIndex);

    collectedNodes.push(node);

    if (name !== 'none') {
      this.staleNodeIndexes.push(nodeIndex);
    }

    switch (name) {
      case 'insert':
        rootNode.insertBefore(node, this.nodesPool(nodePrevIndex));
        rootNode.removeChild(this.nodesPool(nodeIndexToRemove));
        break;
      case 'append':
        rootNode.appendChild(node);
        break;
      case 'replace':
        rootNode.replaceChild(node, this.nodesPool(nodePrevIndex));
        // this.nodesPool(nodePrevIndex).replaceWith(node);
        break;
      case 'remove':
        rootNode.removeChild(node);
        break;
    }
  }

  end() {
    while (this.leads.length > 0) {
      this.applyCommand(this.leads.shift());
    }
  }
}
