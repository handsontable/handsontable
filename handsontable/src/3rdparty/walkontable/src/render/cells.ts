import {
  hasClass,
  removeAttribute,
  removeInlineStyle,
  setAttribute,
} from '../../../../helpers/dom/element';
import { SharedOrderView } from '../utils/orderView';
import { clearAppliedSelection } from '../selection/appliedSelection';
import { BaseRenderer } from './_base';
import {
  A11Y_COLINDEX,
  A11Y_DESCRIBED_BY,
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
    // The rows before the window are not touched at all — not even their order view runs — because
    // the row-headers renderer skips the same rows and the two share one size set per TR
    // (`SharedOrderView`); running either one alone would resize the TR's children without the
    // other's count.
    const { paintFromRow } = this.table;
    // The identity of the rendered band, part of what the host compares against an element's last
    // paint (`shouldPaintCell`): the overlay with the band's offsets and sizes. Where the rows recycle
    // the host is also offered the stable identity, the overlay name alone: a cell's own source
    // coordinates then carry its identity, so an element that kept its row across a scroll
    // (`RowsRenderer` rotates the TRs) reads as unchanged, and a band that grows or shrinks repaints
    // only the cells it adds. The host picks per cell, because it knows which cells paint something
    // that depends on where the band starts or ends (MergeCells clamps a merged block's span to the
    // rendered band); those keep the full identity.
    const band = [
      activeOverlayName, rowFilter?.offset ?? 0, rowsToRender, columnFilter?.offset ?? 0, columnsToRender,
    ].join(',');
    const stableBand = this.table.hasStableCellIdentity() ? activeOverlayName : null;
    // Draw-constant, so resolved once rather than per cell: the column-header id prefix a cell is tied
    // to for screen readers, empty when aria is off, the grid has no column headers, or there is no
    // instance id (DEV-29). `isAriaEnabled()` is checked first so an `ariaTags: false` grid never calls
    // `hasColumnHeaders()`, which fires the public `afterGetColumnHeaderRenderers` hook.
    const columnHeaderIdPrefix = this.table.isAriaEnabled() && this.table.hasColumnHeaders()
      ? this.table.getAriaColumnHeaderIdPrefix() : '';

    for (let visibleRowIndex = paintFromRow; visibleRowIndex < rowsToRender; visibleRowIndex++) {
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
        if (!this.table.shouldPaintCell(
          sourceRowIndex, sourceColumnIndex, TD as HTMLTableCellElement, band, stableBand,
        )) {
          continue; // eslint-disable-line no-continue
        }

        if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
          TD.className = '';
          // The record of the selection classes goes with them. A `hide` cell keeps both, so the
          // selection pass can still take them off when the cell leaves the selection.
          clearAppliedSelection(TD);
        }

        removeInlineStyle(TD);
        TD.removeAttribute('dir');

        // Remove all accessibility-related attributes for the cell to start fresh.
        removeAttribute(TD, [
          /aria-(.*)/,
          /role/
        ]);

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);

        if (this.table.isAriaEnabled()) {
          // Point the cell at its column header so a screen reader announces the header label with the
          // cell - the header is read after the cell's own name, so "C1" becomes "C1, Position". The
          // header is stamped by whichever overlay owns the column (master or inline-start), so a cell
          // in any overlay resolves to it (see `ownsAriaColumnHeaderId`). The prefix is grid-wide and
          // draw-constant, so a bottom-overlay cell - whose own clone renders no header row - still
          // gets the reference; it is empty when the grid has no column headers, and then no attribute
          // is written. Defer to a custom cell renderer that set its own `aria-describedby` (the aria
          // strip above cleared it, so `hasAttribute` is true only when this draw's renderer set one),
          // the same way the `role` above defers to a renderer-set role.
          const columnHeaderId = columnHeaderIdPrefix ? `${columnHeaderIdPrefix}${sourceColumnIndex}` : '';

          setAttribute(TD, [
            ...(TD.hasAttribute('role') ? [] : [A11Y_GRIDCELL()]),
            A11Y_TABINDEX(-1),
            // `aria-colindex` is incremented by both tbody and thead rows.
            A11Y_COLINDEX(sourceColumnIndex + (
              (this.table.rowUtils?.deps?.getRowHeaders() as Function[])?.length ?? 0
            ) + 1),
            ...(columnHeaderId && !TD.hasAttribute('aria-describedby') ? [A11Y_DESCRIBED_BY(columnHeaderId)] : []),
          ]);
        }
      }

      orderView.end();
    }
  }
}
