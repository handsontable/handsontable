import {
  setAttribute,
  removeAttribute,
} from '../../../../helpers/dom/element';
import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
import {
  A11Y_COLINDEX,
  A11Y_COLUMNHEADER,
  A11Y_GRIDCELL_BUTTON,
  A11Y_LABEL,
  A11Y_SCOPE_COL,
  A11Y_TABINDEX,
} from '../../../../helpers/a11y';

/**
 * Column headers renderer responsible for managing (inserting, tracking, rendering) TH elements belongs to TR.
 *
 *   <tr> (root node)
 *     ├ <th>   \
 *     ├ <th>    \
 *     ├ <th>     - ColumnHeadersRenderer
 *     ├ <th>    /
 *     └ <th>   /.
 *
 * @class {ColumnHeadersRenderer}
 */
export class ColumnHeadersRenderer extends BaseRenderer {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderViews = new WeakMap();
  /**
   * Row index which specifies the row position of the processed column header.
   *
   * @type {number}
   */
  sourceRowIndex: number = 0;

  constructor() {
    super('TH');
  }

  /**
   * Obtains the instance of the OrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for column headers (TH).
   * @returns {OrderView}
   */
  obtainOrderView(rootNode: HTMLElement) {
    let orderView;

    if (this.orderViews.has(rootNode)) {
      orderView = this.orderViews.get(rootNode);
    } else {
      orderView = new OrderView(
        rootNode,
        (sourceColumnIndex: number) => this.nodesPool.obtain(this.sourceRowIndex, sourceColumnIndex),
        this.nodeType,
      );
      this.orderViews.set(rootNode, orderView);
    }

    return orderView;
  }

  /**
   * Renders the TH elements.
   */
  render() {
    const {
      columnHeadersCount, columnHeaderFunctions, columnsToRender, rowHeadersCount, columnHeaderRows
    } = this.table;
    const allColumnsToRender = columnsToRender + rowHeadersCount;

    for (let visibleRowIndex = 0; visibleRowIndex < columnHeadersCount; visibleRowIndex++) {
      const TR = columnHeaderRows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = visibleRowIndex;

      const orderView = this.obtainOrderView(TR);

      orderView
        .setSize(allColumnsToRender)
        .setOffset(0)
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < allColumnsToRender; visibleColumnIndex++) {
        orderView.render();

        const renderedColumnIndex = visibleColumnIndex - rowHeadersCount;
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = orderView.getCurrentNode();

        TH.className = '';
        TH.removeAttribute('style');

        // Remove all accessibility-related attributes for the header to start fresh.
        removeAttribute(TH, [
          new RegExp('aria-(.*)'),
          new RegExp('role')
        ]);

        if (this.table.isAriaEnabled()) {
          setAttribute(TH, [
            A11Y_COLINDEX(visibleColumnIndex + 1),
            A11Y_TABINDEX(-1),
            A11Y_COLUMNHEADER(),
            ...(renderedColumnIndex >= 0 ? [
              A11Y_SCOPE_COL(),
            ] : [
              // Adding `role=row` to the corner headers to prevent
              // https://github.com/handsontable/dev-handsontable/issues/1574
              A11Y_GRIDCELL_BUTTON(),
              A11Y_LABEL('Select whole grid')
            ]),
          ]);
        }

        columnHeaderFunctions[visibleRowIndex](sourceColumnIndex, TH, visibleRowIndex);
      }

      orderView.end();
    }
  }
}
