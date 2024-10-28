/**
 * Factory for newly created DOM elements.
 *
 * @class {NodesPool}
 */
export default class NodesPool {
  /**
   * Node type to generate (ew 'th', 'td').
   *
   * @type {string}
   */
  nodeType;
  /**
   * The holder for all obtained DOM nodes.
   *
   * @type {Map<String, HTMLElement>}
   */
  pool = new Map();

  constructor(nodeType) {
    this.nodeType = nodeType.toUpperCase();
  }

  /**
   * Set document owner for this instance.
   *
   * @param {HTMLDocument} rootDocument The document window owner.
   */
  setRootDocument(rootDocument) {
    this.rootDocument = rootDocument;
  }

  /**
   * Obtains an element. The returned elements in the feature can be cached.
   *
   * @returns {HTMLElement}
   */
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

  /**
   * Generates by concatening cache key based on passed arguments.
   *
   * @param {[type]} keyIds
   * @return {[type]}
   */
  _generateCacheKey(keyIds) {
    if (keyIds[0] === void 0) {
      throw new Error('Wrong node id');
    }

    return keyIds.length > 1 ? keyIds.join('x') : keyIds[0];
  }
}
