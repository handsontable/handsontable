import { SharedOrderView } from './../utils/orderView';
import BaseRenderer from './_base';

/**
 * Row headers renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TR.
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
export default class RowHeadersRenderer extends BaseRenderer {
  constructor() {
    super('TH');
    /**
     * Cache for OrderView classes connected to specified node.
     *
     * @type {WeakMap}
     */
    this.orderViews = new WeakMap();
    /**
     * Row index which specifies the row position of the processed row header.
     *
     * @type {Number}
     */
    this.sourceRowIndex = 0;
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for row headers (TH).
   * @return {SharedOrderView}
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
    const { rowsToRender, rowHeaderFunctions, rowHeadersCount, rows, cells } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(TR);
      const cellsView = cells.obtainOrderView(TR);

      orderView
        .appendView(cellsView)
        .setSize(rowHeadersCount)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        orderView.render();

        const TH = orderView.getCurrentNode();

        TH.className = '';
        TH.removeAttribute('style');

        rowHeaderFunctions[visibleColumnIndex](sourceRowIndex, TH, visibleColumnIndex);
      }

      orderView.end();
    }
  }
}
