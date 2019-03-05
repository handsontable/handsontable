import NodesPool from './nodesPool';
import { createLeadsFromOrders } from './orderLeads';

export default class OrderView {
  constructor(rootNode, nodesPool) {
    this.rootNode = rootNode;
    this.nodesPool = nodesPool;
    // this.mutationObserver = new MutationObserver((mutationsList) => {
    //   let size = this.viewSize;
    //
    //   for (var i = 0; i < mutationsList.length; i++) {
    //     const { addedNodes, removedNodes } = mutationsList[i];
    //     const addedNodesLength = addedNodes.length;
    //     const removedNodesLength = removedNodes.length;
    //
    //     if (addedNodesLength > 0 && removedNodesLength === 0) {
    //       size += addedNodesLength;
    //     } else if (addedNodesLength === 0 && removedNodesLength > 0) {
    //       size -= removedNodesLength;
    //     }
    //   }
    //
    //   this.viewSize = size;
    // });

    this.collectedNodes = [];
    this.renderedNodes = 0;
    this.visualIndex = 0;
    this.viewSize = 0;
    this.currOrder = [];
    this.prevOrder = [];
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

  markAsPatternSharer() {
    // this.isPatternSharer = true;
    // this.nodeOrderCommands.length = 0;
  }

  // setPattern(pattern) {
  //   this.pattern = pattern;
  // }

  sharePatternWith(orderView) {
    orderView.pattern = [...this.nodeOrderCommands];
    orderView.renderedNodes = this.renderedNodes;
    orderView.viewSize = this.viewSize;
    orderView.prevOrder = [...this.prevOrder];
    orderView.staleNodeIndexes = [...this.staleNodeIndexes];
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

  start() {
    // @TODO(perf-tip): If view axis position doesn't change this can be optimized to reuse previously collected nodes.
    this.collectedNodes.length = 0;

    // if (this.pattern.length === 0) {
      this.staleNodeIndexes.length = 0;
      // this.mutationObserver.observe(this.rootNode, { childList: true });
    // } else {
      // this.mutationObserver.disconnect();
    // }

    // @TODO: Creating an array is not necessary it would be enought to pass offset and size for current order.
    this.currOrder = createRange(this.offset, this.viewSize);
    // @TODO: Move createLeadsFromOrders to external module + memoization or cache for prevOrder?
    this.commands = createLeadsFromOrders(this.prevOrder, this.currOrder);
  }

  render() {
    const { visualIndex, rootNode, collectedNodes } = this;

    const command = this.commands[visualIndex];
    const [ name, nodeIndex, nodePrevIndex ] = command;
    const node = this.nodesPool(nodeIndex);

    collectedNodes.push(node);

    if (name !== 'none') {
      this.staleNodeIndexes.push(nodeIndex);
    }

    switch (name) {
      case 'insert':
      rootNode.insertBefore(node, this.nodesPool(nodePrevIndex));
      rootNode.removeChild(rootNode.lastChild);
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

    this.visualIndex += 1;
  }

  end() {
    this.prevOrder = this.currOrder;
    this.currOrder = [];

    // this.pattern.length = 0;
    this.isPatternSharer = false;
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
