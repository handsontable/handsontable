import {
  hasClass,
  removeAttribute,
  setAttribute,
} from '../../../../helpers/dom/element';
import { SharedOrderView } from '../utils/orderView';
import { BaseRenderer } from './_base';
import {
  A11Y_COLINDEX,
  A11Y_GRIDCELL,
  A11Y_TABINDEX
} from '../../../../helpers/a11y';
import { CellsRendererInterface, TableRendererInterface } from './interfaces';
import { RowHeadersRenderer } from './rowHeaders';

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
export class CellsRenderer extends BaseRenderer implements CellsRendererInterface {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderViews: WeakMap<HTMLElement, SharedOrderView> = new WeakMap();
  /**
   * Row index which specifies the row position of the processed cell.
   *
   * @type {number}
   */
  sourceRowIndex: number = 0;
  /**
   * The visual row index.
   */
  visualRowIndex: number = 0;
  /**
   * The source column index.
   */
  sourceColumnIndex: number = 0;
  /**
   * The visual column index.
   */
  visualColumnIndex: number = 0;
  /**
   * The row header count.
   */
  rowHeaderCount: number = 0;
  declare table: TableRendererInterface;

  constructor() {
    super('TD', document.createElement('tr'));
  }

  /**
   * Sets the row header count.
   */
  setRowHeaderCount(count: number): void {
    this.rowHeaderCount = count;
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for cells (TD).
   * @returns {SharedOrderView}
   */
  obtainOrderView(rootNode: HTMLTableRowElement): SharedOrderView {
    let orderView: SharedOrderView;

    if (this.orderViews.has(rootNode)) {
      orderView = this.orderViews.get(rootNode)!;
    } else {
      orderView = new SharedOrderView(
        rootNode,
        (sourceColumnIndex: number) => this.nodesPool?.obtain(this.sourceRowIndex, sourceColumnIndex) || document.createElement('TD'),
      );
      this.orderViews.set(rootNode, orderView);
    }

    return orderView;
  }

  /**
   * Adjusts the number of rendered nodes.
   */
  adjust(): void {
    // This method is implemented in the parent class but overridden with empty implementation.
  }

  /**
   * Renders the cells.
   */
  render(): void {
    if (!this.table) {
      return;
    }

    const { rowsToRender, columnsToRender, rows, rowHeaders } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = (rows as any).getRenderedNode(visibleRowIndex);
      if (!TR) {
        continue;
      }

      this.sourceRowIndex = sourceRowIndex;
      this.visualRowIndex = visibleRowIndex;

      const orderView = this.obtainOrderView(TR);
      const rowHeadersView = (rowHeaders as RowHeadersRenderer).obtainOrderView(TR);

      orderView
        .prependView(rowHeadersView)
        .setSize(columnsToRender)
        .setOffset(0)
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
        orderView.render();

        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
        this.sourceColumnIndex = sourceColumnIndex;
        this.visualColumnIndex = visibleColumnIndex;

        const TD = orderView.getCurrentNode();
        if (!TD) {
          continue;
        }

        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
        }

        TD.removeAttribute('style');
        TD.removeAttribute('dir');

        // Remove all accessibility-related attributes for the cell to start fresh.
        removeAttribute(TD, [
          new RegExp('aria-(.*)'),
          new RegExp('role')
        ]);

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);

        if (this.table.isAriaEnabled()) {
          setAttribute(TD, [
            ...(TD.hasAttribute('role') ? [] : [A11Y_GRIDCELL()]),
            A11Y_TABINDEX(-1),
            // `aria-colindex` is incremented by both tbody and thead rows.
            // @ts-ignore - We're using optional chaining to access possible properties that TS doesn't know about
            A11Y_COLINDEX(sourceColumnIndex + (this.table.rowUtils?.dataAccessObject?.rowHeaders?.length ?? 0) + 1),
          ]);
        }
      }

      orderView.end();
    }
  }
}
