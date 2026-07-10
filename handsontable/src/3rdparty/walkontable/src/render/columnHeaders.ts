import {
  addClass,
  hasClass,
  removeClass,
  setAttribute,
  removeAttribute,
} from '../../../../helpers/dom/element';
import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
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
