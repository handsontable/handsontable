import { SharedOrderView } from '../utils/orderView';
import { BaseRenderer } from './_base';
import { removeInlineStyle } from '../../../../helpers/dom/element';
import { clearAppliedSelection } from '../selection/appliedSelection';
import {
  A11Y_COLINDEX,
  A11Y_ROWHEADER,
  A11Y_SCOPE_ROW,
  A11Y_TABINDEX
} from '../../../../helpers/a11y';
import { NO_KEPT_ARIA_ATTRIBUTES, syncAriaAttributes } from './ariaAttributes';
import type { KeptAriaAttributes } from './ariaAttributes';

const [ROLE, ROWHEADER] = A11Y_ROWHEADER();
const [SCOPE, SCOPE_ROW] = A11Y_SCOPE_ROW();
const COLINDEX = A11Y_COLINDEX(0)[0];
const [TABINDEX, TABINDEX_VALUE] = A11Y_TABINDEX(-1);

/**
 * Lists the accessibility attributes of a row header, in the order a new element gets them.
 *
 * @param {number} visibleColumnIndex The row header level, counted from 0.
 * @returns {KeptAriaAttributes}
 */
function getRowHeaderAriaAttributes(visibleColumnIndex: number): KeptAriaAttributes {
  return {
    [ROLE]: ROWHEADER,
    [SCOPE]: SCOPE_ROW,
    [COLINDEX]: String(visibleColumnIndex + 1),
    [TABINDEX]: String(TABINDEX_VALUE),
  };
}

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
        () => this.nodesPool!.obtain() as HTMLElement,
        this.nodeType!,
      ));
    }

    return this.orderViews.get(rootNode)!;
  }

  /**
   * Renders the cells.
   *
   * Stamps no `htLastRowHeaderColumn` marker, unlike `ColumnHeadersRenderer#render`: the seam to
   * column 0 needs one only in a HEAD row, where CSS cannot tell a corner `th` from a column
   * header. Every `th` in a BODY row is a row header, so the theme rule matches them all.
   */
  render() {
    const { rowsToRender, rowHeaderFunctions, rowHeadersCount, rows, cells } = this.table;
    // Same window as `CellsRenderer#render`, and it has to be: the two renderers share one order
    // view size set per TR, so a row skipped by one must be skipped by the other.
    const { paintFromRow } = this.table;
    const ariaEnabled = this.table.isAriaEnabled();

    for (let visibleRowIndex = paintFromRow; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows!.getRenderedNode(visibleRowIndex);

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

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
        clearAppliedSelection(TH);
        removeInlineStyle(TH);

        // Clear the accessibility attributes the previous paint of this (recycled) header left and write
        // the ones this draw gives it, each only when its value differs.
        syncAriaAttributes(TH, ariaEnabled
          ? getRowHeaderAriaAttributes(visibleColumnIndex)
          : NO_KEPT_ARIA_ATTRIBUTES);

        rowHeaderFunctions[visibleColumnIndex](sourceRowIndex, TH, visibleColumnIndex);
      }

      orderView.end();
    }
  }
}
