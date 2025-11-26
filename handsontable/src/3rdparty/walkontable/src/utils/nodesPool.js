import { isFirefox } from '../../../../helpers/browser';

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
    this.nodeType = nodeType.toUpperCase();
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
   * Obtains an element.
   *
   * @param {number} rowIndex The row index.
   * @param {number} [columnIndex] The column index.
   * @returns {HTMLElement}
   */
  obtain(rowIndex, columnIndex) {
    // Firefox requires creating new DOM elements instead of reusing pooled nodes to avoid
    // rendering issues. This bypasses the pooling mechanism and is consistent with the
    // Firefox-specific renderer adapter used in OrderView.
    if (isFirefox()) {
      return this.rootDocument.createElement(this.nodeType);
    }

    const hasColumnIndex = typeof columnIndex === 'number';
    const key = hasColumnIndex ? `${rowIndex}x${columnIndex}` : rowIndex.toString();

    if (this.pool.has(key)) {
      return this.pool.get(key);
    }

    const node = this.rootDocument.createElement(this.nodeType);

    this.pool.set(key, node);

    return node;
  }
}
