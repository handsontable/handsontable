import NodesPool from './../utils/nodesPool';

/**
 * Base renderer class, abstract logic for specialized renderers.
 *
 * @class BaseRenderer
 */
export default class BaseRenderer {
  constructor(nodeType, rootNode) {
    /**
     * Factory for newly created DOM elements.
     *
     * NodePool should be used for each renderer. For the first stage of the refactoring
     * process, only some of the renderers are implemented a new approach.
     *
     * @type {NodesPool|null}
     */
    this.nodesPool = typeof nodeType === 'string' ? new NodesPool(nodeType) : null;
    /**
     * Node type which the renderer will manage while building the table (eg. 'TD', 'TR', 'TH').
     *
     * @type {String}
     */
    this.nodeType = nodeType;
    /**
     * The root node to which newly created elements will be inserted.
     *
     * @type {HTMLElement}
     */
    this.rootNode = rootNode;
    /**
     * The instance of the Table class, a wrapper for all renderers and holder for properties describe table state.
     *
     * @type {TableRenderer}
     */
    this.table = null;
    /**
     * Counter of nodes already added.
     *
     * @type {Number}
     */
    this.renderedNodes = 0;
  }

  /**
   * Sets the table renderer instance to the current renderer.
   *
   * @param {TableRenderer} table The TableRenderer instance.
   */
  setTable(table) {
    if (this.nodesPool) {
      this.nodesPool.setRootDocument(table.rootDocument);
    }

    this.table = table;
  }

  /**
   * Adjusts the number of rendered nodes.
   */
  adjust() { }

  /**
   * Renders the contents to the elements.
   */
  render() { }
}
