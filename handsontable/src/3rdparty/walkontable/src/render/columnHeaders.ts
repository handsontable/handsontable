import {
  addClass,
  hasClass,
  removeClass,
  setAttribute,
  removeAttribute,
} from '../../../../helpers/dom/element';
import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
import { clearAppliedSelection } from '../selection/appliedSelection';
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
  orderViews = new WeakMap<HTMLElement, OrderView>();

  /**
   * Creates a new ColumnHeadersRenderer instance.
   */
  constructor() {
    super('TH');
  }

  /**
   * Obtains the instance of the OrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for column headers (TH).
   * @returns {OrderView}
   */
  obtainOrderView(rootNode: HTMLElement): OrderView {
    if (!this.orderViews.has(rootNode)) {
      this.orderViews.set(rootNode, new OrderView(
        rootNode,
        () => this.nodesPool!.obtain() as HTMLElement,
        this.nodeType!,
      ));
    }

    return this.orderViews.get(rootNode)!;
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
      const TR = columnHeaderRows!.getRenderedNode(visibleRowIndex);

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

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

        if (!TH) {
          continue; // eslint-disable-line no-continue
        }

        TH.className = '';
        clearAppliedSelection(TH);
        TH.removeAttribute('style');

        // Remove all accessibility-related attributes for the header to start fresh.
        removeAttribute(TH, [
          /aria-(.*)/,
          /role/
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

        // Marks the cell that owns the head row's copy of the seam to column 0, for the theme rule
        // that colors it. The first `rowHeadersCount` cells of this row are the CORNER cells, and
        // the last of them sits above the row header that owns that seam in the body. CSS cannot
        // pick it out: a corner is a `th` exactly like the column headers beside it, and only the
        // engine knows how many there are. `:first-child` is what the rule used before, which
        // selects the same cell with one row header and the WRONG one with more - the first corner,
        // whose inline-end is an inner seam. A BODY row needs no marker, because every `th` there is
        // a row header and the rule can match them all (`RowHeadersRenderer#render`).
        //
        // Stamped AFTER the header renderer runs: `TH.className` is reset above and a renderer is
        // free to assign to it, which would wipe a marker applied earlier. No clearing pass is
        // needed, unlike `htLastVisibleHeader`, and the invariant that makes that safe is
        // `orderView.start()`: it sizes the root to exactly the nodes this view owns, and the loop
        // then visits every one of them and resets `className` before deciding. So no node can keep
        // a marker from a previous draw - on a shrink included, where the node that survives may be
        // the one that carried it. What would break this is gating the reset the way
        // `render/cells.ts` gates its own behind `shouldPaintCell()`: a skipped header cell would
        // keep a stale marker, so a clearing pass has to arrive with any such gate.
        //
        // The index test alone covers `rowHeadersCount === 0`: the target is then -1 and this loop
        // only ever counts up from 0, so a row with no corner cells marks nothing.
        if (visibleColumnIndex === rowHeadersCount - 1) {
          addClass(TH, 'htLastRowHeaderColumn');
        }
      }

      orderView.end();

      this.#markLastVisibleHeader(TR);
    }
  }

  /**
   * Stamps the `htLastVisibleHeader` class on the last TH of the header row that does not carry
   * the `hiddenHeader` class (nested headers hide their colspan-continuation THs with it), and
   * clears the class from every other TH. The theme CSS rounds the trailing header corner with
   * this class. It replaces the former `th:not(.hiddenHeader):not(:has(~ th:not(.hiddenHeader)))`
   * theme selector: any `:has()` rule in a stylesheet makes Chrome re-run host-page-scaled style
   * invalidation on DOM mutations, so the state is stamped here, after the row's headers (and the
   * header renderers that toggle `hiddenHeader`) have been rendered.
   *
   * @param {HTMLElement} TR The header row (TR element) to process.
   */
  #markLastVisibleHeader(TR: HTMLElement): void {
    const { children } = TR;
    let lastVisibleTH: Element | null = null;

    for (let index = children.length - 1; index >= 0; index--) {
      const TH = children[index];

      if (lastVisibleTH === null && !hasClass(TH as HTMLElement, 'hiddenHeader')) {
        lastVisibleTH = TH;

        if (!hasClass(TH as HTMLElement, 'htLastVisibleHeader')) {
          addClass(TH as HTMLElement, 'htLastVisibleHeader');
        }
      } else if (hasClass(TH as HTMLElement, 'htLastVisibleHeader')) {
        removeClass(TH as HTMLElement, 'htLastVisibleHeader');
      }
    }
  }
}
