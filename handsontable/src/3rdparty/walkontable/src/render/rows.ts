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
   * The source row the first TR held after the last render. `-1` until the first render, which is
   * what tells the rotation there is no previous band to rotate.
   *
   * @type {number}
   */
  #lastOffset: number = -1;
  /**
   * The number of TR elements the last render left in the root node.
   *
   * @type {number}
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

    this.#recycleRows(nextOffset, rowsToRender);

    this.orderView
      .setSize(rowsToRender)
      .setOffset(nextOffset)
      .start();

    // Recorded right after the elements were rotated and the band was sized, so the record describes
    // the TBODY from here on whatever a later pass does with it.
    this.#lastOffset = nextOffset;
    this.#lastSize = rowsToRender;

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
  }

  /**
   * On a scroll-driven draw, rotates the TR elements so a row that stays in the rendered band keeps
   * its TR (and so its TDs). The rows that scrolled out wrap to the other end and are overwritten by
   * the rows that scrolled in. After the rotation the TR at index `i` holds source row
   * `nextOffset + i` for every row that was already rendered, which is exactly what the cell pass is
   * about to paint there – so the host's paint stamps match for the whole overlap and, under
   * `renderMode: 'onChange'`, those cells are left as they are.
   *
   * @param {number} nextOffset The source row the first TR will hold on this draw.
   * @param {number} nextSize The number of rows this draw will render.
   */
  #recycleRows(nextOffset: number, nextSize: number) {
    if (!this.table.isRowRecyclingAllowed()) {
      return;
    }

    const rootNode = this.rootNode as HTMLElement;
    const lastSize = this.#lastSize;
    const delta = nextOffset - this.#lastOffset;
    const shift = Math.abs(delta);

    if (
      this.#lastOffset < 0 ||
      lastSize === 0 ||
      // An empty band renders nothing; `nextOffset` is then a sentinel, not a real offset, so the
      // delta it produces is meaningless and the rotation would move rows `start()` is about to drop.
      nextSize === 0 ||
      delta === 0 ||
      // No row survives the move, so every TR would be repainted anyway: rotating them is pure cost.
      // The rotation moves elements that exist, so in either direction the shift must stay below the
      // previous size (scrolling up past it would run the move out of elements). Scrolling up, the
      // survivors are the new band's rows past the shift, so the shift must stay below the new size
      // too; scrolling down the new size takes no part, and a band that shrinks on the same draw
      // still keeps the rows past the shift (`start()` trims the rest).
      shift >= lastSize ||
      (delta < 0 && shift >= nextSize) ||
      rootNode.childElementCount !== lastSize
    ) {
      return;
    }

    const rootDocument = rootNode.ownerDocument;
    // A focused cell in a row that leaves the band is detached with its row for the duration of the
    // move. Chromium blurs a removed element only at its next rendering step, by which time the row
    // is back; an engine that blurs at once would drop the grid's focus to the body here. In that case
    // the element gets the focus back, without scrolling to it: it is the element the previous draw
    // left focused, about to show another row, exactly as a stationary element would.
    const focusedElement = rootDocument.activeElement;
    const focusedInBand = focusedElement !== null && rootNode.contains(focusedElement);
    const fragment = rootDocument.createDocumentFragment();

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

    if (focusedInBand && rootDocument.activeElement !== focusedElement) {
      (focusedElement as HTMLElement).focus({ preventScroll: true });
    }
  }
}
