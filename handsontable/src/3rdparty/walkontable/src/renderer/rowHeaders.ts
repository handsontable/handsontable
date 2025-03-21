import { SharedOrderView } from '../utils/orderView';
import { BaseRenderer } from './_base';
import { setAttribute, removeAttribute } from '../../../../helpers/dom/element';
import {
  A11Y_COLINDEX,
  A11Y_ROWHEADER,
  A11Y_SCOPE_ROW,
  A11Y_TABINDEX
} from '../../../../helpers/a11y';
import { RowHeadersRendererInterface, TableRendererInterface } from './interfaces';

/**
 * Row headers renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TR.
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
export class RowHeadersRenderer extends BaseRenderer implements RowHeadersRendererInterface {
  declare table: TableRendererInterface;
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderViews = new WeakMap<HTMLTableRowElement, SharedOrderView>();
  /**
   * Row index which specifies the row position of the processed row header.
   *
   * @type {number}
   */
  sourceRowIndex: number = 0;
  visualRowIndex: number = 0;
  columnHeaderLevelCount: number = 0;

  constructor() {
    super('TH', document.createElement('tr'));
  }

  /**
   * Sets the column header level count.
   *
   * @param {number} count Number of column header levels.
   */
  setColumnHeaderLevelCount(count: number): void {
    this.columnHeaderLevelCount = count;
  }

  /**
   * Sets the row header content renderer function.
   *
   * @param {Function} contentFactory Function which renders the row header content.
   */
  setRowHeaderContent(contentFactory: (sourceRow: number, TH: HTMLTableCellElement, headerLevel: number) => void): void {
    if (this.table) {
      this.table.rowHeaderFunctions = [contentFactory];
    }
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for row headers (TH).
   * @returns {SharedOrderView}
   */
  obtainOrderView(rootNode: HTMLTableRowElement): SharedOrderView {
    let orderView: SharedOrderView;

    if (this.orderViews.has(rootNode)) {
      orderView = this.orderViews.get(rootNode)!;
    } else {
      orderView = new SharedOrderView(
        rootNode,
        (sourceColumnIndex: number) => this.nodesPool?.obtain(this.sourceRowIndex, sourceColumnIndex) || document.createElement('TH'),
      );
      this.orderViews.set(rootNode, orderView);
    }

    return orderView;
  }

  /**
   * Adjusts the number of the rendered elements.
   */
  adjust(): void {
    // Implementation will be added later if needed
  }

  /**
   * Renders the cells.
   */
  render(): void {
    const { rowsToRender, rowHeaderFunctions, rowHeadersCount, rows, cells } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex) as HTMLTableRowElement;

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(TR);
      const cellsView = cells.obtainOrderView(TR);

      orderView
        .appendView(cellsView)
        .setSize(rowHeadersCount)
        .setOffset(0)
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        orderView.render();

        const TH = orderView.getCurrentNode() as HTMLTableCellElement;

        TH.className = '';
        TH.removeAttribute('style');

        // Remove all accessibility-related attributes for the header to start fresh.
        removeAttribute(TH, [
          new RegExp('aria-(.*)'),
          new RegExp('role')
        ]);

        if (this.table.isAriaEnabled()) {
          setAttribute(TH, [
            A11Y_ROWHEADER(),
            A11Y_SCOPE_ROW(),
            A11Y_COLINDEX(visibleColumnIndex + 1),
            A11Y_TABINDEX(-1)
          ]);
        }

        rowHeaderFunctions[visibleColumnIndex](sourceRowIndex, TH, visibleColumnIndex);
      }

      orderView.end();
    }
  }
}
