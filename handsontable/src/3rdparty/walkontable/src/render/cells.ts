import {
  hasClass,
  removeInlineStyle,
} from '../../../../helpers/dom/element';
import { SharedOrderView } from '../utils/orderView';
import { clearAppliedSelection } from '../selection/appliedSelection';
import { BaseRenderer } from './_base';
import {
  A11Y_COLINDEX,
  A11Y_DESCRIBED_BY,
  A11Y_GRIDCELL,
  A11Y_LABELED_BY,
  A11Y_TABINDEX
} from '../../../../helpers/a11y';
import {
  isClearedAriaAttribute,
  isKeptDescribedBy,
  isKeptLabelledBy,
  setAttributeIfChanged,
  setAttributeIfMissing,
} from './ariaAttributes';

const [ROLE, GRIDCELL] = A11Y_GRIDCELL();
const TABINDEX = A11Y_TABINDEX(-1)[0];
const TABINDEX_VALUE = String(A11Y_TABINDEX(-1)[1]);
const COLINDEX = A11Y_COLINDEX(0)[0];
const DESCRIBED_BY = A11Y_DESCRIBED_BY('')[0];
const LABELED_BY = A11Y_LABELED_BY('')[0];

/**
 * Checks whether an attribute is one of the cell's own accessibility attributes, which are overwritten with
 * this draw's values rather than cleared.
 *
 * @param {string} name The attribute name.
 * @param {string} columnHeaderId The id of the cell's column header, empty when the cell has none.
 * @param {boolean} describedByKept Whether the cell's `aria-describedby` stays as it is.
 * @param {boolean} labelledByKept Whether the cell's `aria-labelledby` stays as it is.
 * @returns {boolean}
 */
function isOwnCellAriaAttribute(
  name: string,
  columnHeaderId: string,
  describedByKept: boolean,
  labelledByKept: boolean,
): boolean {
  return name === ROLE || name === COLINDEX || (name === DESCRIBED_BY && (columnHeaderId !== '' || describedByKept)) ||
    (name === LABELED_BY && labelledByKept);
}

/**
 * Brings a cell's accessibility attributes to the state its renderer starts from, before the renderer runs:
 * every attribute the previous paint of this (recycled) element left is cleared, and the cell's own ones are
 * set to this draw's values, each written only when it differs. A repaint of an element that already holds
 * exactly that state, which is what a vertical scroll does, makes no DOM write; a horizontal scroll rewrites
 * the two that follow the column. A fresh element and a recycled one reach the renderer in the same state, so
 * what a renderer that reads these attributes produces does not depend on the element's history. Two values a
 * plugin wrote after the previous paint are the exception and stay (`isKeptDescribedBy`, `isKeptLabelledBy`), so a
 * repaint does not remove them only for the plugin to write them again.
 *
 * @param {HTMLElement} TD The cell.
 * @param {boolean} ariaEnabled Whether the grid writes accessibility attributes; without them every one is
 * cleared.
 * @param {string} ariaColIndex The cell's `aria-colindex`.
 * @param {string} columnHeaderId The id of the cell's column header, empty when the cell has none.
 */
function prepareCellAriaAttributes(
  TD: HTMLElement,
  ariaEnabled: boolean,
  ariaColIndex: string,
  columnHeaderId: string,
): void {
  const attributeNames = TD.getAttributeNames();
  // A description reference the cell painter wrote on the previous paint stays: resetting it to the column header
  // here would make the painter write it again after the renderer, two DOM writes on every repaint of the cell.
  const describedByKept = ariaEnabled && isKeptDescribedBy(TD.getAttribute(DESCRIBED_BY), columnHeaderId);
  const labelledByKept = ariaEnabled && isKeptLabelledBy(TD.getAttribute(LABELED_BY), TD.id);

  for (let i = 0; i < attributeNames.length; i++) {
    const name = attributeNames[i];

    if (
      isClearedAriaAttribute(name) &&
      !(ariaEnabled && isOwnCellAriaAttribute(name, columnHeaderId, describedByKept, labelledByKept))
    ) {
      TD.removeAttribute(name);
    }
  }

  if (ariaEnabled) {
    setAttributeIfChanged(TD, ROLE, GRIDCELL);
    setAttributeIfChanged(TD, TABINDEX, TABINDEX_VALUE);
    setAttributeIfChanged(TD, COLINDEX, ariaColIndex);

    if (columnHeaderId && !describedByKept) {
      setAttributeIfChanged(TD, DESCRIBED_BY, columnHeaderId);
    }
  }
}

/**
 * Restores the cell's own accessibility attributes after its renderer ran. The `role` and the
 * `aria-describedby` defer to a renderer that set its own, so they are written back only when the renderer
 * removed them; `aria-colindex` and `tabindex` are core's, and are written back when the renderer changed them.
 *
 * @param {HTMLElement} TD The cell.
 * @param {string} ariaColIndex The cell's `aria-colindex`.
 * @param {string} columnHeaderId The id of the cell's column header, empty when the cell has none.
 */
function restoreCellAriaAttributes(TD: HTMLElement, ariaColIndex: string, columnHeaderId: string): void {
  setAttributeIfMissing(TD, ROLE, GRIDCELL);
  setAttributeIfChanged(TD, TABINDEX, TABINDEX_VALUE);
  setAttributeIfChanged(TD, COLINDEX, ariaColIndex);

  if (columnHeaderId) {
    setAttributeIfMissing(TD, DESCRIBED_BY, columnHeaderId);
  }
}

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
    const ariaEnabled = this.table.isAriaEnabled();
    const columnHeaderIdPrefix = ariaEnabled && this.table.hasColumnHeaders()
      ? this.table.getAriaColumnHeaderIdPrefix() : '';
    const ariaColIndexOffset = ariaEnabled
      ? ((this.table.rowUtils?.deps?.getRowHeaders() as Function[])?.length ?? 0) + 1
      : 0;

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

        // `aria-colindex` is incremented by both tbody and thead rows.
        const ariaColIndex = ariaEnabled ? String(sourceColumnIndex + ariaColIndexOffset) : '';
        // Point the cell at its column header so a screen reader announces the header label with the
        // cell - the header is read after the cell's own name, so "C1" becomes "C1, Position". The
        // header is stamped by whichever overlay owns the column (master or inline-start), so a cell
        // in any overlay resolves to it (see `ownsAriaColumnHeaderId`). The prefix is grid-wide and
        // draw-constant, so a bottom-overlay cell - whose own clone renders no header row - still
        // gets the reference; it is empty when the grid has no column headers, and then no attribute
        // is written.
        const columnHeaderId = columnHeaderIdPrefix ? `${columnHeaderIdPrefix}${sourceColumnIndex}` : '';

        prepareCellAriaAttributes(TD, ariaEnabled, ariaColIndex, columnHeaderId);

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD);

        if (ariaEnabled) {
          restoreCellAriaAttributes(TD, ariaColIndex, columnHeaderId);
        }
      }

      orderView.end();
    }
  }
}
