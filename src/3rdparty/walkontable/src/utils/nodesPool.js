export default class NodesPool {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.pool = new Map();
  }

  setRootDocument(rootDocument) {
    this.rootDocument = rootDocument;
  }

  obtain(...args) {
    // @TODO (perf-tip) This can be optimalized to make smaller pool of available nodes. Currently,
    // elements are created for all cells.
    // To be considered implementing LRU or similar cache strategy? or spatial hash map?
    const key = this._generateCacheKey(args);
    let node;

    if (this.pool.has(key)) {
      node = this.pool.get(key);
    } else {
      node = this.rootDocument.createElement(this.nodeType);
      // node.dataset.id = key; // Uncomment for debug purposes
      this.pool.set(key, node);
    }

    return node;
  }

  isCached(...args) {
    return this.pool.has(this._generateCacheKey(args));
  }

  _generateCacheKey(keyIds) {
    if (keyIds[0] === void 0) {
      throw new Error('Wrong node id');
    }

    return keyIds.length > 1 ? keyIds.join('x') : keyIds[0];
  }
}
