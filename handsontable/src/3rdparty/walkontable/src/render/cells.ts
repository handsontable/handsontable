import {
  hasClass,
  removeAttribute,
  setAttribute,
} from '../../../../helpers/dom/element';
import { SharedOrderView } from '../utils/orderView';
import { clearAppliedSelection } from '../selection/appliedSelection';
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
        () => this.nodesPool!.obtain() as HTMLElement,
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
    const { rowFilter, columnFilter, activeOverlayName } = this.table;
    // The identity of the rendered band: which source rows and columns the reused elements hold on
    // this draw. The host compares it against the element's last paint. The band size stays in it
    // even though a reused element's own source indexes already move with the offsets: MergeCells
    // clamps a merged cell's rowspan and colspan to the rendered band, so a cell whose indexes did
    // not change still needs a paint when the band grows or shrinks.
    const band = [
      activeOverlayName, rowFilter?.offset ?? 0, rowsToRender, columnFilter?.offset ?? 0, columnsToRender,
    ].join(',');

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows!.getRenderedNode(visibleRowIndex);

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

        // The host may keep the element as it is (`renderMode: 'onChange'`); then nothing below runs.
        if (!this.table.shouldPaintCell(sourceRowIndex, sourceColumnIndex, TD as HTMLTableCellElement, band)) {
          continue; // eslint-disable-line no-continue
        }

        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
          // The record of the selection classes goes with them. A `hide` cell keeps both, so the
          // selection pass can still take them off when the cell leaves the selection.
          clearAppliedSelection(TD);
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
              (this.table.rowUtils?.deps?.getRowHeaders() as Function[])?.length ?? 0
            ) + 1),
          ]);
        }
      }

      orderView.end();
    }
  }
}
