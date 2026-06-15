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
export class CellsRenderer extends BaseRenderer {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderViews: WeakMap<object, SharedOrderView> = new WeakMap();
  /**
   * Row index which specifies the row position of the processed cell.
   *
   * @type {number}
   */
  sourceRowIndex = 0;

  /**
   * Creates a new CellsRenderer instance.
   */
  constructor() {
    super('TD');
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for cells (TD).
   * @returns {SharedOrderView}
   */
  obtainOrderView(rootNode: HTMLElement): SharedOrderView {
    if (!this.orderViews.has(rootNode)) {
      this.orderViews.set(rootNode, new SharedOrderView(
        rootNode,
        (sourceColumnIndex?: number) => this.nodesPool!.obtain(this.sourceRowIndex, sourceColumnIndex) as HTMLElement,
        this.nodeType!,
      ));
    }

    return this.orderViews.get(rootNode)!;
  }

  /**
   * Renders the cells.
   */
  render() {
    const { rowsToRender, columnsToRender, rows, rowHeaders } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows!.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

      const orderView = this.obtainOrderView(TR);
      const rowHeadersView = rowHeaders!.obtainOrderView(TR);

      orderView
        .prependView(rowHeadersView)
        .setSize(columnsToRender)
        .setOffset(0)
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
        orderView.render();

        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
        const TD = orderView.getCurrentNode();

        if (!TD) {
          continue; // eslint-disable-line no-continue
        }

        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
        }

        TD.removeAttribute('style');
        TD.removeAttribute('dir');

        // Remove all accessibility-related attributes for the cell to start fresh.
        removeAttribute(TD, [
          /aria-(.*)/,
          /role/
        ]);

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);

        if (this.table.isAriaEnabled()) {
          setAttribute(TD, [
            ...(TD.hasAttribute('role') ? [] : [A11Y_GRIDCELL()]),
            A11Y_TABINDEX(-1),
            // `aria-colindex` is incremented by both tbody and thead rows.
            A11Y_COLINDEX(sourceColumnIndex + (
              (this.table.rowUtils?.dataAccessObject?.rowHeaders as Function[])?.length ?? 0
            ) + 1),
          ]);
        }
      }

      orderView.end();
    }
  }
}
