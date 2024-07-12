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
  obtain() {
    return this.rootDocument.createElement(this.nodeType);
  }
}
