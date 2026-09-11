import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { OrderView } from '../utils/orderView';
import {
  addClass,
  hasClass,
  removeClass,
  setAttribute
} from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWGROUP,
  A11Y_ROWINDEX
} from '../../../../helpers/a11y';

const ROW_CLASSNAMES = {
  rowEven: 'ht__row_even',
  rowOdd: 'ht__row_odd',
};
let performanceWarningAppeared = false;

/**
 * Rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TBODY.
 *
 *   <tbody> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - RowsRenderer
 *     ├ <tr>    /
 *     └ <tr>   /.
 *
 * @class {RowsRenderer}
 */
export class RowsRenderer extends BaseRenderer {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  declare orderView: OrderView;
  /**
   * SPIKE (#13446): the source row the first TR held after the last render, and the band size then.
   * `-1` until the first render.
   */
  #lastOffset: number = -1;
  /**
   * SPIKE (#13446): the number of TR elements the last render left in the root node.
   */
  #lastSize: number = 0;

  /**
   * Creates a new RowsRenderer instance.
   *
   * @param {HTMLElement} rootNode - The root node (TBODY element) for managing TR elements.
   */
  constructor(rootNode: HTMLElement) {
    super('TR', rootNode);

    this.orderView = new OrderView(
      rootNode,
      () => this.nodesPool!.obtain() as HTMLElement,
      this.nodeType!,
    );
  }

  /**
   * Returns currently rendered node.
   *
   * @param {string} visualIndex Visual index of the rendered node (it always goeas from 0 to N).
   * @returns {HTMLTableRowElement}
   */
  getRenderedNode(visualIndex: number) {
    return this.orderView.getNode(visualIndex);
  }

  /**
   * Renders the cells.
   */
  render() {
    const { rowsToRender } = this.table;

    if (!performanceWarningAppeared && rowsToRender > 1000) {
      performanceWarningAppeared = true;
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows.\x20
        Consider limiting the number of rendered rows by specifying the table height and/or\x20
        turning off the "renderAllRows" option.`);
    }

    if (this.table.isAriaEnabled()) {
      setAttribute(this.rootNode as HTMLElement, [
        A11Y_ROWGROUP()
      ]);
    }

    const nextOffset = rowsToRender > 0 ? this.table.renderedRowToSource(0) : 0;

    this.#recycleRows(nextOffset);

    this.orderView
      .setSize(rowsToRender)
      .setOffset(nextOffset)
      .start();

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

      if (this.table.isAriaEnabled()) {
        setAttribute(TR, [
          A11Y_ROW(),
          // `aria-rowindex` is incremented by both tbody and thead rows.
          A11Y_ROWINDEX(sourceRowIndex + (
            (this.table.rowUtils?.deps?.getColumnHeaders() as Function[])?.length ?? 0
          ) + 1),
        ]);
      }

      if ((sourceRowIndex + 1) % 2 === 0) {
        if (!hasClass(TR, ROW_CLASSNAMES.rowEven)) {
          removeClass(TR, ROW_CLASSNAMES.rowOdd);
          addClass(TR, ROW_CLASSNAMES.rowEven);
        }
      } else if (!hasClass(TR, ROW_CLASSNAMES.rowOdd)) {
        removeClass(TR, ROW_CLASSNAMES.rowEven);
        addClass(TR, ROW_CLASSNAMES.rowOdd);
      }
    }

    this.orderView.end();

    this.#lastOffset = nextOffset;
    this.#lastSize = rowsToRender;
  }

  /**
   * SPIKE (#13446): on a scroll-driven draw, rotates the TR elements so a row that stays in the
   * rendered band keeps its TR (and so its TDs). The rows that scrolled out wrap to the other end
   * and are overwritten by the rows that scrolled in. After the rotation the TR at index `i` holds
   * source row `nextOffset + i` for every row that was already rendered, which is exactly what the
   * cell pass is about to paint there – so a `td`-keyed renderer cache hits for the whole overlap.
   *
   * @param {number} nextOffset The source row the first TR will hold on this draw.
   */
  #recycleRows(nextOffset: number) {
    if (!this.table.isRowRecyclingAllowed()) {
      return;
    }

    const rootNode = this.rootNode as HTMLElement;
    const lastSize = this.#lastSize;
    const delta = nextOffset - this.#lastOffset;

    if (
      this.#lastOffset < 0 ||
      lastSize === 0 ||
      delta === 0 ||
      Math.abs(delta) >= lastSize ||
      rootNode.childElementCount !== lastSize
    ) {
      return;
    }

    const fragment = rootNode.ownerDocument.createDocumentFragment();

    if (delta > 0) {
      // Scrolled down: the first `delta` rows left the band – send them to the bottom, in order.
      for (let i = 0; i < delta; i++) {
        fragment.appendChild(rootNode.firstElementChild!);
      }
      rootNode.appendChild(fragment);

    } else {
      // Scrolled up: the last `-delta` rows left the band – send them to the top, in order.
      for (let i = 0; i < -delta; i++) {
        fragment.insertBefore(rootNode.lastElementChild!, fragment.firstChild);
      }
      rootNode.insertBefore(fragment, rootNode.firstChild);
    }
  }
}
