import {
  hasClass,
} from './../../../../helpers/dom/element';
import { SharedOrderView } from './../utils/orderView';
import BaseRenderer from './_base';

/**
 * Cell renderer responsible for managing (inserting, tracking, rendering) TD elements.
 *
 *   <tr> (root node)
 *     ├ <th>   --- RowHeadersRenderer
 *     ├ <td>   \
 *     ├ <td>    \
 *     ├ <td>     - CellsRenderer
 *     ├ <td>    /
 *     └ <td>   /
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
    this.orderViews = new Map();
    /**
     * Row index which specifies the row position of the processed cell.
     *
     * @type {Number}
     */
    this.sourceRowIndex = 0;
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {Number} sourceRowIndex The source row index of currently processed row.
   * @param {HTMLTableRowElement} [rootNode] The TR element, which is root element for cells (TD).
   * @returns {SharedOrderView}
   */
  obtainOrderView(sourceRowIndex, rootNode = null) {
    let orderView;

    if (this.orderViews.has(sourceRowIndex)) {
      orderView = this.orderViews.get(sourceRowIndex);
    } else {
      orderView = new SharedOrderView(
        rootNode,
        sourceColumnIndex => this.nodesPool.obtain(this.sourceRowIndex, sourceColumnIndex),
      );
      this.orderViews.set(sourceRowIndex, orderView);
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
      // const hasStaleRowContent = rows.hasStaleContent(sourceRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(sourceRowIndex, TR);
      const rowHeadersView = rowHeaders.obtainOrderView(sourceRowIndex, TR);

      // @TODO(perf-tip): For cells other than "visual 0" generating diff leads/commands can be skipped. New order view
      // shoule share state between next orderViews.
      orderView
        .prependView(rowHeadersView)
        .setSize(columnsToRender)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
        orderView.render();

        const TD = orderView.getCurrentNode();
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
        // const hasStaleContent = hasStaleRowContent || orderView.hasStaleContent(sourceColumnIndex);

        // if (hasStaleContent) {
        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
        }
        TD.removeAttribute('style');
        // }

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);
      }

      orderView.end();
    }
  }
}
