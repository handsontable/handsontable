import NodesPool from './nodesPool';
import { createLeadsFromOrders } from './orderLeads';

export default class OrderView {
  constructor(rootNode, nodesPool) {
    this.rootNode = rootNode;
    this.nodesPool = nodesPool;

    this.collectedNodes = [];
    this.renderedNodes = 0;
    this.visualIndex = 0;
    this.viewSize = 0;
    this.nextOrder = [];
    this.currOrder = [];
    this.staleNodeIndexes = [];

    // tmp
    this.isPatternSharer = false;
    this.orderLeads = [];
    this.pattern = [];
  }

  setSize(size) {
    this.viewSize = size;

    return this;
  }

  setOffset(offset) {
    this.offset = offset;

    return this;
  }

  setRootNode(rootNode) {
    this.rootNode = rootNode;
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

    // @TODO(perf-tip): Creating an array is not necessary it would be enought to pass offset and size for current and next order.
    const nextOrder = createRange(this.offset, this.viewSize);
    // @TODO(perf-tip): Move createLeadsFromOrders to external module + memoization or cache for currOrder?
    this.commands = createLeadsFromOrders(this.currOrder, nextOrder);

    this.is = is;

    // if (this.is) {
      // console.log(1, this.commands.toString(), 'prev', this.currOrder.toString(), 'curr', nextOrder.toString());
    // }

    this.currOrder = [];
  }

  render() {
    const command = this.commands.shift();
    const [ , nodeIndex ] = command;

    // if (this.is) {
      // console.log('command', command);
    // }

    this.currOrder.push(nodeIndex);
    this.applyCommand(command);
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
        // rootNode.removeChild(rootNode.lastChild);
        rootNode.removeChild(this.nodesPool(nodeIndexToRemove));
        break;
      case 'append':
        rootNode.appendChild(node);
        break;
      case 'replace':
        rootNode.replaceChild(node, this.nodesPool(nodePrevIndex));
        break;
      case 'remove':
        rootNode.removeChild(node);
        break;
    }
  }

  end() {
    while (this.commands.length > 0) {
      this.applyCommand(this.commands.shift());
    }

    // this.currOrder = this.nextOrder;
    // this.nextOrder = [];

    // this.pattern.length = 0;
    // this.isPatternSharer = false;
    this.visualIndex = 0;
  }
}

function createRange(from, length) {
  const range = [];

  for (var i = 0; i < length; i++) {
    range.push(from + i);
  }

  return range;
}
