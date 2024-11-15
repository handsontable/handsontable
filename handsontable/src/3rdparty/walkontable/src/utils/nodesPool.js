/**
 * Factory for newly created DOM elements.
 *
 * @class {NodesPool}
 */
export class NodesPool {
  /**
   * Node type to generate (e.g. 'TH', 'TD').
   *
   * @type {string}
   */
  nodeType;
  /**
   * The holder for all created DOM nodes (THs, TDs).
   *
   * @type {Map<string, HTMLElement>}
   */
  pool = new Map();

  constructor(nodeType) {
    this.nodeType = nodeType;
  }

  /**
   * Set document owner for this instance.
   *
   * @param {Document} rootDocument The document window owner.
   */
  setRootDocument(rootDocument) {
    this.rootDocument = rootDocument;
  }

  /**
   * Obtains an element. The returned elements in the feature can be cached.
   *
   * @param {number} rowIndex The row index.
   * @param {number} [columnIndex] The column index.
   * @returns {HTMLElement}
   */
  obtain(rowIndex, columnIndex) {
    // @TODO (perf-tip) This can be optimized to make smaller pool of available nodes.
    // To be considered implementing LRU or similar cache strategy? or spatial hash map?
    const hasColumnIndex = typeof columnIndex === 'number';
    const key = hasColumnIndex ? `${rowIndex}x${columnIndex}` : rowIndex.toString();

    if (this.pool.has(key)) {
      return this.pool.get(key);
    }

    const node = this.rootDocument.createElement(this.nodeType);

    // node.dataset.id = key; // Uncomment for debug purposes
    this.pool.set(key, node);

    return node;
  }
}
