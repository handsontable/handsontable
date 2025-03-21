import { NodesPool } from '../utils/nodesPool';
import { BaseRendererInterface, TableRendererInterface } from './interfaces';

/**
 * Base renderer class, abstract logic for specialized renderers.
 *
 * @class BaseRenderer
 */
export class BaseRenderer implements BaseRendererInterface {
  /**
   * Factory for newly created DOM elements.
   *
   * NodePool should be used for each renderer. For the first stage of the refactoring
   * process, only some of the renderers are implemented a new approach.
   *
   * @type {NodesPool|null}
   */
  nodesPool: NodesPool | null = null;
  /**
   * Node type which the renderer will manage while building the table (eg. 'TD', 'TR', 'TH').
   *
   * @type {string}
   */
  nodeType: string;
  /**
   * The root node to which newly created elements will be inserted.
   *
   * @type {HTMLElement}
   */
  rootNode: HTMLElement;
  /**
   * The instance of the Table class, a wrapper for all renderers and holder for properties describe table state.
   *
   * @type {TableRenderer}
   */
  table: TableRendererInterface | null = null;
  /**
   * Counter of nodes already added.
   *
   * @type {number}
   */
  renderedNodes: number = 0;

  constructor(nodeType: string, rootNode: HTMLElement) {
    this.nodesPool = typeof nodeType === 'string' ? new NodesPool(nodeType) : null;
    this.nodeType = nodeType;
    this.rootNode = rootNode;
  }

  /**
   * Sets the table renderer instance to the current renderer.
   *
   * @param {TableRenderer} table The TableRenderer instance.
   */
  setTable(table: TableRendererInterface): void {
    if (this.nodesPool) {
      this.nodesPool.setRootDocument(table.rootDocument);
    }

    this.table = table;
  }

  /**
   * Adjusts the number of rendered nodes.
   */
  adjust(): void { }

  /**
   * Renders the contents to the elements.
   */
  render(): void { }
}
