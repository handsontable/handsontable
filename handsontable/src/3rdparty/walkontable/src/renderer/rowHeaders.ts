import { SharedOrderView } from '../utils/orderView';
import { BaseRenderer } from './_base';
import { setAttribute, removeAttribute } from '../../../../helpers/dom/element';
import {
  A11Y_COLINDEX,
  A11Y_ROWHEADER,
  A11Y_SCOPE_ROW,
  A11Y_TABINDEX
} from '../../../../helpers/a11y';

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
export class RowHeadersRenderer extends BaseRenderer {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderViews: WeakMap<object, SharedOrderView> = new WeakMap();
  /**
   * Row index which specifies the row position of the processed row header.
   *
   * @type {number}
   */
  sourceRowIndex = 0;

  /**
   * Creates a new RowHeadersRenderer instance.
   */
  constructor() {
    super('TH');
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for row headers (TH).
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
    const { rowsToRender, rowHeaderFunctions, rowHeadersCount, rows, cells } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows!.getRenderedNode(visibleRowIndex);

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(TR);
      const cellsView = cells!.obtainOrderView(TR);

      orderView
        .appendView(cellsView)
        .setSize(rowHeadersCount)
        .setOffset(0)
        .start();

      // Render the row header levels in order: the renderer fills the row header nodes positionally
      // (childNodes[0], [1], …), so level 0 must be written first to land in the leftmost position.
      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        orderView.render();

        const TH = orderView.getCurrentNode();

        if (!TH) {
          continue; // eslint-disable-line no-continue
        }

        TH.className = '';
        TH.removeAttribute('style');

        // Remove all accessibility-related attributes for the header to start fresh.
        removeAttribute(TH, [
          /aria-(.*)/,
          /role/
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
