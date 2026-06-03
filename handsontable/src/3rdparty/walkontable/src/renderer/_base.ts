import { NodesPool } from '../utils/nodesPool';
import type { TableRenderer } from './table';

/**
 * Base renderer class, abstract logic for specialized renderers.
 *
 * @class BaseRenderer
 */
export class BaseRenderer {
  /**
   * Factory for newly created DOM elements.
   *
   * @type {NodesPool|null}
   */
  nodesPool: NodesPool | null = null;
  /**
   * Node type which the renderer will manage while building the table (eg. 'TD', 'TR', 'TH').
   *
   * @type {string}
   */
  declare nodeType: string | null;
  /**
   * The root node to which newly created elements will be inserted.
   *
   * @type {HTMLElement}
   */
  declare rootNode: HTMLElement;
  /**
   * The instance of the Table class, a wrapper for all renderers and holder for properties describe table state.
   *
   * @type {TableRenderer}
   */
  declare table: TableRenderer;
  /**
   * Counter of nodes already added.
   *
   * @type {number}
   */
  renderedNodes: number = 0;

  constructor(nodeType: string | null, rootNode?: HTMLElement) {
    this.nodesPool = typeof nodeType === 'string' ? new NodesPool(nodeType) : null;
    this.nodeType = nodeType;

    if (rootNode !== undefined) {
      this.rootNode = rootNode;
    }
  }

  /**
   * Sets the table renderer instance to the current renderer.
   *
   * @param {TableRenderer} table The TableRenderer instance.
   */
  setTable(table: TableRenderer) {
    if (this.nodesPool) {
      this.nodesPool.setRootDocument(table.rootDocument);
    }

    this.table = table;
  }

  /**
   * Renders the contents to the elements.
   */
  render() { // intentionally empty
  }
}
