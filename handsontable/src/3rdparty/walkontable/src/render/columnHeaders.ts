import {
  addClass,
  hasClass,
  removeClass,
  removeInlineStyle,
} from '../../../../helpers/dom/element';
import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
import { clearAppliedSelection } from '../selection/appliedSelection';
import {
  A11Y_COLINDEX,
  A11Y_COLUMNHEADER,
  A11Y_GRIDCELL,
  A11Y_SCOPE_COL,
  A11Y_TABINDEX,
} from '../../../../helpers/a11y';
import {
  clearStaleAriaAttributes,
  NO_KEPT_ARIA_ATTRIBUTES,
  setAttributeIfChanged,
  syncAriaAttributes,
} from './ariaAttributes';
import type { KeptAriaAttributes } from './ariaAttributes';

const ID = 'id';
const COLINDEX = A11Y_COLINDEX(0)[0];
const [TABINDEX, TABINDEX_VALUE] = A11Y_TABINDEX(-1);
const [ROLE, COLUMNHEADER] = A11Y_COLUMNHEADER();
const [SCOPE, SCOPE_COL] = A11Y_SCOPE_COL();
// The corner headers are plain grid cells, not column headers, to prevent
// https://github.com/handsontable/dev-handsontable/issues/1574. They carry no name of their own, so a control
// rendered into one (the RowSelection "select all" checkbox) names itself.
const GRIDCELL = A11Y_GRIDCELL()[1];

/**
 * Lists the accessibility attributes of a column header, in the order a new element gets them.
 *
 * @param {string} ariaColIndex The header's `aria-colindex`.
 * @returns {KeptAriaAttributes}
 */
function getColumnHeaderAriaAttributes(ariaColIndex: string): KeptAriaAttributes {
  return {
    [COLINDEX]: ariaColIndex,
    [TABINDEX]: String(TABINDEX_VALUE),
    [ROLE]: COLUMNHEADER,
    [SCOPE]: SCOPE_COL,
  };
}

/**
 * Lists the accessibility attributes of a corner header, in the order a new element gets them.
 *
 * @param {string} ariaColIndex The header's `aria-colindex`.
 * @returns {KeptAriaAttributes}
 */
function getCornerAriaAttributes(ariaColIndex: string): KeptAriaAttributes {
  return {
    [COLINDEX]: ariaColIndex,
    [TABINDEX]: String(TABINDEX_VALUE),
    [ROLE]: GRIDCELL,
  };
}

/**
 * Brings a header's accessibility attributes and its `id` to this draw's values: clears the ones the previous
 * paint of this (pooled) header left, and writes each one that differs. `id` is handled here as well, because
 * pooled nodes are reused across draws and only the owning overlay's leaf header carries one - a header that
 * stops being the leaf or owning header (or a corner cell reused as a header) must not keep a stale id a data
 * cell points at.
 *
 * @param {HTMLElement} TH The header.
 * @param {string} ariaColIndex The header's `aria-colindex`.
 * @param {boolean} isCorner Whether the header is a corner cell above the row headers.
 * @param {string} columnHeaderId The id the header carries, empty when it carries none.
 */
function writeColumnHeaderAriaAttributes(
  TH: HTMLElement,
  ariaColIndex: string,
  isCorner: boolean,
  columnHeaderId: string,
): void {
  syncAriaAttributes(TH, isCorner
    ? getCornerAriaAttributes(ariaColIndex)
    : getColumnHeaderAriaAttributes(ariaColIndex));

  if (isCorner) {
    // A pooled element that showed a column header (before row headers were turned on) carries its `scope`.
    TH.removeAttribute(SCOPE);
  }

  if (columnHeaderId) {
    setAttributeIfChanged(TH, ID, columnHeaderId);
  } else {
    TH.removeAttribute(ID);
  }
}

/**
 * Clears every accessibility attribute and the `id` of a header, for a grid that writes none.
 *
 * @param {HTMLElement} TH The header.
 */
function clearColumnHeaderAriaAttributes(TH: HTMLElement): void {
  clearStaleAriaAttributes(TH, NO_KEPT_ARIA_ATTRIBUTES);
  TH.removeAttribute(ID);
}

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
    // Draw-constant, so resolved once rather than per header (mirrors the cells renderer): the id
    // prefix a data cell references through `aria-describedby`, empty without an instance id (DEV-29),
    // and the frozen-column count the ownership check needs (a mapper-walking function in core).
    const ariaEnabled = this.table.isAriaEnabled();
    const columnHeaderIdPrefix = ariaEnabled ? this.table.getAriaColumnHeaderIdPrefix() : '';
    const fixedColumnsStart = columnHeaderIdPrefix ? this.table.getFixedColumnsStart() : 0;
    const firstFixedEndColumn = columnHeaderIdPrefix ? this.table.getFirstFixedEndColumn() : Infinity;

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
        removeInlineStyle(TH);

        if (ariaEnabled) {
          // The leaf header row carries the id a data cell references through `aria-describedby`. Only
          // the overlay that owns the column stamps it, so exactly one header in the grid holds each id
          // (a frozen column is owned by the inline-start overlay, every other column by the master -
          // see `ownsAriaColumnHeaderId`). The leaf row is the one that is 1:1 with a column; higher
          // rows in nested headers are colspanned group labels and are left out of v1.
          const columnHeaderId = columnHeaderIdPrefix &&
            renderedColumnIndex >= 0 &&
            visibleRowIndex === columnHeadersCount - 1 &&
            this.table.ownsAriaColumnHeaderId(sourceColumnIndex, fixedColumnsStart, firstFixedEndColumn)
            ? `${columnHeaderIdPrefix}${sourceColumnIndex}`
            : '';
          const ariaColIndex = String(this.table.getAriaColumnHeaderIndex(
            visibleColumnIndex, renderedColumnIndex >= 0 ? sourceColumnIndex : -1,
          ));

          writeColumnHeaderAriaAttributes(TH, ariaColIndex, renderedColumnIndex < 0, columnHeaderId);

        } else {
          clearColumnHeaderAriaAttributes(TH);
        }

        columnHeaderFunctions[visibleRowIndex](sourceColumnIndex, TH, visibleRowIndex);

        // The LAST of this row's `rowHeadersCount` corner cells: it owns the head row's copy of the
        // seam to column 0, which the theme rule colors. CSS cannot pick it out - a corner is a `th`
        // like the column headers beside it - so `:first-child` was the rule's old key and it selects
        // the wrong corner once there are two. `rowHeadersCount === 0` needs no guard: the target is
        // then -1 and this loop counts up from 0. Stamped after the header renderer runs, which is
        // free to assign to `TH.className`. Why no clearing pass, and what would need one:
        // AGENTS.md, "Column-axis border ownership".
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
