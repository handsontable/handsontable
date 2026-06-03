import from '../../../../helpers/browser';

/**
 * Multiplier used to pack (row, column) into a single numeric Map key.
 * 2^20 (1 048 576) supports up to ~1M columns while keeping the combined
 * value well within the 2^53 safe-integer range for any realistic row count.
 *
 */
const COLUMN_OFFSET = 1048576;

/**
 * Factory for newly created DOM elements.
 *
 * @class {NodesPool}
 */
export class NodesPool {
  /**
   * Node type to generate (e.g. 'TH', 'TD').
   *
   */
  nodeType;
  /**
   * The document instance used to create new DOM elements when no pooled element is available.
   */
  declare rootDocument: Document;
  /**
   * The holder for all created DOM nodes (THs, TDs).
   *
   */
  pool: Map<number, HTMLElement> = new Map();

  /**
   * @param nodeType The HTML tag name for nodes to create (e.g. `'TD'` or `'TH'`).
   */
  constructor(nodeType: string) {
    this.nodeType = nodeType.toUpperCase();
  }

  /**
   * Set document owner for this instance.
   *
   * @param rootDocument The document window owner.
   */
  setRootDocument(rootDocument: Document) {
    this.rootDocument = rootDocument;
  }

  /**
   * Obtains an element.
   *
   * @param rowIndex The row index.
   * @param [columnIndex] The column index.
   * @returns 
   */
  obtain(rowIndex: number, columnIndex?: number) {
    // Firefox requires creating new DOM elements instead of reusing pooled nodes to avoid
    // rendering issues. This bypasses the pooling mechanism and is consistent with the
    // Direct DOM renderer adapter used in OrderView.
    if (isFirefox()) {
      return this.rootDocument.createElement(this.nodeType);
    }

    const key = typeof columnIndex === 'number'
      ? (rowIndex * COLUMN_OFFSET) + columnIndex
      : rowIndex;

    let node = this.pool.get(key);

    if (node !== undefined) {
      return node;
    }

    node = this.rootDocument.createElement(this.nodeType);

    this.pool.set(key, node);

    return node;
  }
}
