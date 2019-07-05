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
     * @type {String}
     */
    this.nodeType = nodeType;
  }

  /**
   * Set document owner for this instance.
   *
   * @param {HTMLDocument} rootDocument
   */
  setRootDocument(rootDocument) {
    this.rootDocument = rootDocument;
  }

  /**
   * Obtains an element. The returned elements in the feature can be cached.
   *
   * @return {HTMLElement}
   */
  obtain() {
    return this.rootDocument.createElement(this.nodeType);
  }
}
