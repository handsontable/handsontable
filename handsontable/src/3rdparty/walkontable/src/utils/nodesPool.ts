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
  nodeType: string;
  /**
   * The holder for all created DOM nodes (THs, TDs).
   *
   * @type {Map<string, HTMLElement>}
   */
  pool: Map<string, HTMLElement> = new Map();
  /**
   * The document owner of this instance.
   * 
   * @type {Document}
   */
  rootDocument!: Document;

  constructor(nodeType: string) {
    this.nodeType = nodeType.toUpperCase();
  }

  /**
   * Set document owner for this instance.
   *
   * @param {Document} rootDocument The document window owner.
   */
  setRootDocument(rootDocument: Document): void {
    this.rootDocument = rootDocument;
  }

  /**
   * Obtains an element.
   *
   * @param {number} rowIndex The row index.
   * @param {number} [columnIndex] The column index.
   * @returns {HTMLElement}
   */
  obtain(rowIndex: number, columnIndex?: number): HTMLElement {
    const hasColumnIndex = typeof columnIndex === 'number';
    const key = hasColumnIndex ? `${rowIndex}x${columnIndex}` : rowIndex.toString();

    if (this.pool.has(key)) {
      return this.pool.get(key)!;
    }

    const node = this.rootDocument.createElement(this.nodeType);

    this.pool.set(key, node);

    return node;
  }
}
