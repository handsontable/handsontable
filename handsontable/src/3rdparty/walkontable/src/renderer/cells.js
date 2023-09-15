import {
  hasClass,
  setAttribute,
} from './../../../../helpers/dom/element';
import { SharedOrderView } from './../utils/orderView';
import BaseRenderer from './_base';

const ACCESSIBILITY_ATTR_GRIDCELL = ['role', 'gridcell'];
const ACCESSIBILITY_ATTR_TABINDEX = ['tabindex', '-1'];
const ACCESSIBILITY_ATTR_COLINDEX = ['aria-colindex'];

/**
 * Cell renderer responsible for managing (inserting, tracking, rendering) TD elements.
 *
 *   <tr> (root node)
 *     ├ <th>   --- RowHeadersRenderer
 *     ├ <td>   \
 *     ├ <td>    \
 *     ├ <td>     - CellsRenderer
 *     ├ <td>    /
 *     └ <td>   /.
 *
 * @class {CellsRenderer}
 */
export default class CellsRenderer extends BaseRenderer {
  constructor() {
    super('TD');
    /**
     * Cache for OrderView classes connected to specified node.
     *
     * @type {WeakMap}
     */
    this.orderViews = new WeakMap();
    /**
     * Row index which specifies the row position of the processed cell.
     *
     * @type {number}
     */
    this.sourceRowIndex = 0;
  }

  /**
   * Get a set of accessibility-related attributes to be added to the table.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(settings) {
    if (!this.table.isAriaEnabled()) {
      return [];
    }

    const {
      elementIdentifier,
      columnIndex
    } = settings;

    switch (elementIdentifier) {
      case 'cell':
        return [
          ACCESSIBILITY_ATTR_GRIDCELL,
          ACCESSIBILITY_ATTR_TABINDEX,
          // `aria-colindex` is incremented by both tbody and thead rows.
          [ACCESSIBILITY_ATTR_COLINDEX[0], columnIndex + this.table.rowHeadersCount + 1],
        ];

      default:
        return [];
    }
  }

  /**
   * Get the list of all attributes to be added to the table cells.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAttributes(settings) {
    return [
      ...this.#getAccessibilityAttributes(settings)
    ];
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for cells (TD).
   * @returns {SharedOrderView}
   */
  obtainOrderView(rootNode) {
    let orderView;

    if (this.orderViews.has(rootNode)) {
      orderView = this.orderViews.get(rootNode);
    } else {
      orderView = new SharedOrderView(
        rootNode,
        sourceColumnIndex => this.nodesPool.obtain(this.sourceRowIndex, sourceColumnIndex),
        this.nodeType,
      );
      this.orderViews.set(rootNode, orderView);
    }

    return orderView;
  }

  /**
   * Renders the cells.
   */
  render() {
    const { rowsToRender, columnsToRender, rows, rowHeaders } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(TR);
      const rowHeadersView = rowHeaders.obtainOrderView(TR);

      // @TODO(perf-tip): For cells other than "visual 0" generating diff leads/commands can be skipped. New order view
      // should share state between next orderViews.
      orderView
        .prependView(rowHeadersView)
        .setSize(columnsToRender)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
        orderView.render();

        const TD = orderView.getCurrentNode();
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);

        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
        }

        TD.removeAttribute('style');
        TD.removeAttribute('dir');

        setAttribute(TD, this.#getAttributes({
          elementIdentifier: 'cell',
          columnIndex: sourceColumnIndex,
        }));

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);
      }

      orderView.end();
    }
  }
}
