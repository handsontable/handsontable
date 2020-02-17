/**
 * Factory for newly created DOM elements.
 *
 * @class {NodesPool}
 */
export default class NodesPool {
  constructor(nodeType) {
    /**
     * Node type to generate (ew 'th', 'td').
     *
     * @type {string}
     */
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
  obtain() {
    return this.rootDocument.createElement(this.nodeType);
  }
}
