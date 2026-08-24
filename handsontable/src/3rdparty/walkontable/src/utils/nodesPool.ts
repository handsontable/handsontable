/**
 * Factory for newly created DOM elements.
 *
 * Historically this class cached nodes keyed by source coordinate so the diffing renderer could
 * reuse them. The engine now renders directly to a fixed, viewport-sized set of DOM nodes
 * (see OrderView), so no cache is needed — `obtain()` simply creates a fresh element. The class is
 * kept as a thin factory for backward compatibility with the Walkontable export surface.
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
   * The root document object for creating DOM elements.
   *
   * @type {Document}
   */
  declare rootDocument: Document;

  /**
   * Creates a new NodesPool instance.
   *
   * @param {string} nodeType The type of DOM node to generate (e.g. 'TH', 'TD').
   */
  constructor(nodeType: string) {
    this.nodeType = nodeType.toUpperCase();
  }

  /**
   * Set document owner for this instance.
   *
   * @param {Document} rootDocument The document window owner.
   */
  setRootDocument(rootDocument: Document) {
    this.rootDocument = rootDocument;
  }

  /**
   * Creates and returns a new DOM element of the configured node type. The row/column arguments are
   * accepted for backward compatibility with the renderer factories and are ignored.
   *
   * @param {number} [_rowIndex] Ignored. Kept for call-site compatibility.
   * @param {number} [_columnIndex] Ignored. Kept for call-site compatibility.
   * @returns {HTMLElement}
   */
  obtain(_rowIndex?: number, _columnIndex?: number) {
    return this.rootDocument.createElement(this.nodeType);
  }
}
