import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { OrderView } from '../utils/orderView';
import {
  addClass,
  getDeepActiveElement,
  getShadowHostChain,
  hasClass,
  removeClass,
  setAttribute
} from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWINDEX,
  rebuildAccessibilityObject
} from '../../../../helpers/a11y';
import { dropRowGroupRole, dropRowRole, giveRowGroupRole } from './ariaAttributes';

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
   * The host's render epoch the previous render recorded with `#lastOffset` (see
   * `TableRenderer#renderEpoch`).
   */
  #lastEpoch = 0;

  /**
   * The number of column header rows the rows' `aria-rowindex` was counted from on the last draw, `null` before
   * the first one and for a grid that writes no ARIA.
   */
  #lastColumnHeadersCount: number | null = null;

  /**
   * The source row each TR showed after the last render it took part in, so a draw can tell whether
   * the focused TR is about to show another row (see `#renewFocusedRow`).
   */
  #shownRows = new WeakMap<Element, number>();

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
   * Tells whether the number of column header rows changed since the last draw that painted rows. The first draw,
   * a draw with no rows (the change waits for the draw that shows them), and a grid that writes no ARIA, answer
   * `false`.
   *
   * @returns {boolean}
   */
  #hasColumnHeadersCountChanged(): boolean {
    if (!this.table.isAriaEnabled()) {
      this.#lastColumnHeadersCount = null;

      return false;
    }

    if (this.table.rowsToRender === 0) {
      return false;
    }

    const { columnHeadersCount } = this.table;
    const hasChanged = this.#lastColumnHeadersCount !== null && this.#lastColumnHeadersCount !== columnHeadersCount;

    this.#lastColumnHeadersCount = columnHeadersCount;

    return hasChanged;
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

    // A row is a `row`, and its section a `rowgroup`, only while the row holds a cell: a side clone that was
    // turned off is drawn one last time with the master's rows and none of its columns.
    const rowsHoldCells = this.table.columnsToRender + this.table.rowHeadersCount > 0;

    if (this.table.isAriaEnabled()) {
      if (rowsToRender > 0 && rowsHoldCells) {
        giveRowGroupRole(this.rootNode as HTMLElement);
      } else {
        dropRowGroupRole(this.rootNode as HTMLElement);
      }
    }

    // A reader keeps the position it learned for a row. When the column headers that shift every row's index
    // appear or go, each row gets a new accessibility object, once, so the reader counts again.
    const rebuildAllRows = this.#hasColumnHeadersCountChanged();
    const nextOffset = rowsToRender > 0 ? this.table.renderedRowToSource(0) : 0;
    const focusedElement = this.#recycleRows(nextOffset, rowsToRender);

    this.orderView
      .setSize(rowsToRender)
      .setOffset(nextOffset)
      .start();

    const renewedFocusedRow = this.#renewFocusedRow(rowsToRender, focusedElement);

    // Recorded right after the elements were rotated and the band was sized, so the record describes
    // the TBODY from here on whatever a later pass does with it. The epoch says which index-mapper
    // state the offset belongs to.
    this.#lastOffset = nextOffset;
    this.#lastSize = rowsToRender;
    this.#lastEpoch = this.table.renderEpoch;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

      if (!TR) {
        continue; // eslint-disable-line no-continue
      }

      this.#shownRows.set(TR, sourceRowIndex);

      if (this.table.isAriaEnabled() && rowsHoldCells) {
        setAttribute(TR, [
          A11Y_ROW(),
          // `aria-rowindex` is incremented by both tbody and thead rows.
          A11Y_ROWINDEX(sourceRowIndex + (
            (this.table.rowUtils?.deps?.getColumnHeaders() as Function[])?.length ?? 0
          ) + 1),
        ]);

        if (rebuildAllRows) {
          rebuildAccessibilityObject(TR);
        }
      } else if (this.table.isAriaEnabled()) {
        dropRowRole(TR);
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
    this.#restoreFocus(renewedFocusedRow ? null : focusedElement);
  }

  /**
   * Gives the focused row a new TR, and so new cells, when this draw is about to paint into it the row
   * the host moves the browser focus to right after the draw (`TableRenderer#getPendingFocusRow`), and
   * the TR showed another row before. Without it the host would focus the element that already holds
   * the focus: no focus event fires, and Chromium keeps the accessibility object of the element, so a
   * screen reader announces nothing although the cell under the focus changed. Chromium creates a new
   * accessibility object only for a new element. That happens when no row survives a move of the band
   * (a jump to the last row), so the rows are rebuilt in place and each TR shows the row of its
   * position, and when a row the move took out of the band wraps to the slot of the target row. A
   * draw the host does not follow with a focus move (a plain scroll) keeps the element, so the focus
   * stays where it is and no event fires.
   *
   * Runs after `start()` sized the band and before the row pass, so the cells and row headers of the
   * new TR are built by this draw. The removal blurs the old element at once in Firefox and WebKit;
   * the host then focuses the new cell, so the grid gets its `focusin` back in the same task.
   *
   * @param {number} rowsToRender The number of rows this draw renders.
   * @param {HTMLElement|null} movedFocusedElement The focused element the rotation moved, which an
   *   engine that blurs a detached element no longer reports as focused; `null` for the focused
   *   element of the document.
   * @returns {boolean} `true` when the focused row got a new TR.
   */
  #renewFocusedRow(rowsToRender: number, movedFocusedElement: HTMLElement | null): boolean {
    if (rowsToRender === 0) {
      return false;
    }

    const rootNode = this.rootNode as HTMLElement;
    const focusedElement = movedFocusedElement ?? getDeepActiveElement(rootNode.ownerDocument);
    const focusedRow = focusedElement === null ? null : this.#rowOf(focusedElement as HTMLElement);

    if (focusedRow === null) {
      return false;
    }

    const targetRow = this.table.getPendingFocusRow();
    const index = Array.prototype.indexOf.call(rootNode.children, focusedRow);

    if (
      targetRow === null ||
      index >= rowsToRender ||
      this.table.renderedRowToSource(index) !== targetRow ||
      (this.table.renderEpoch === this.#lastEpoch && this.#shownRows.get(focusedRow) === targetRow)
    ) {
      return false;
    }

    rootNode.replaceChild(this.nodesPool!.obtain() as HTMLElement, focusedRow);

    return true;
  }

  /**
   * Gives the focus back to an element the rotation detached and re-attached, on an engine that
   * blurred it on removal. Runs after the row pass has settled the TBODY, so the `focusin` this fires
   * reaches its listeners with every TR in place; nothing in the tree renders or reads a cell element
   * from a focus event, and an editor's input lives outside the TBODY, so it is never the element
   * this refocuses.
   *
   * @param {HTMLElement|null} focusedElement The element `#recycleRows` found focused inside the band.
   */
  #restoreFocus(focusedElement: HTMLElement | null) {
    if (focusedElement === null) {
      return;
    }

    const rootDocument = (this.rootNode as HTMLElement).ownerDocument;

    if (getDeepActiveElement(rootDocument) !== focusedElement) {
      focusedElement.focus({ preventScroll: true });
    }
  }

  /**
   * On a scroll-driven draw, rotates the TR elements so a row that stays in the rendered band keeps
   * its TR (and so its TDs). The rows that scrolled out wrap to the other end and are overwritten by
   * the rows that scrolled in. After the rotation the TR at index `i` holds source row
   * `nextOffset + i` for every row that was already rendered, which is exactly what the cell pass is
   * about to paint there – so the host's paint stamps match for the whole overlap and, under
   * `renderMode: 'onChange'`, those cells are left as they are. Only rows that LEAVE the band wrap:
   * a band that moves up and grows past its old end at the same time (a refill re-pass, or a
   * recompute with non-uniform heights) keeps every tail row in place and gets fresh TRs for the
   * front slots the leaving rows cannot fill; `start()` counts them as part of the band.
   *
   * @param {number} nextOffset The source row the first TR will hold on this draw.
   * @param {number} nextSize The number of rows this draw will render.
   * @returns {HTMLElement|null} The focused element the move detached, for `#restoreFocus` to give the
   *   focus back to once the band has settled; `null` when nothing was rotated or nothing was focused
   *   inside the band.
   */
  #recycleRows(nextOffset: number, nextSize: number): HTMLElement | null {
    if (!this.table.isRowRecyclingAllowed()) {
      return null;
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
      // The offsets are renderable indexes, and a renderable index names the same row only within one
      // index-mapper state. A mapping change with no render in between (a hide, a trim, a move, a
      // sort) advances the host's epoch; the delta then compares two different spaces and the rows
      // are rebuilt in place instead. The host repaints every cell after such a change anyway.
      this.table.renderEpoch !== this.#lastEpoch ||
      rootNode.childElementCount !== lastSize
    ) {
      return null;
    }

    const rootDocument = rootNode.ownerDocument;
    // A focused element in a row that leaves the band is detached with its row for the duration of
    // the move. Chromium blurs a removed element only at its next rendering step, by which time the
    // row is back; an engine that blurs at once would drop the browser focus to the body here, and
    // the grid's focus state with it (a `focusout` with no `focusin` to follow). In that case the
    // element gets the focus back, without scrolling to it. This keeps the focus WHERE it was, on an
    // element the cell pass is about to paint another row into; it does not preserve what the element
    // shows. A TD outlives that paint, so the grid's own cell focus survives; an embedded control
    // does only if its renderer updates it in place, exactly as on a stationary grid. Read through
    // `getDeepActiveElement`: inside a shadow root `document.activeElement` is the host, which the
    // TBODY never contains. The reverse holds for a control inside a web-component cell: `contains`
    // stops at the cell's shadow boundary, so the band holds the element when it holds the element
    // itself or one of its shadow hosts. `activeElement` stays set while the document does not hold
    // the focus (a blurred iframe), and giving it the focus back would pull the focus into the frame,
    // so the restore is only armed while the document has it.
    const focusedElement = rootDocument.hasFocus() ? getDeepActiveElement(rootDocument) : null;
    const focusedInBand = focusedElement !== null && (
      rootNode.contains(focusedElement) ||
      getShadowHostChain(focusedElement).some(host => rootNode.contains(host))
    );
    const rotated = delta > 0 ?
      delta :
      Math.min(shift, Math.max(0, (this.#lastOffset + lastSize) - (nextOffset + nextSize)));
    const movesInPlace = focusedInBand && canMoveWithoutDetaching(rootNode);

    if (movesInPlace) {
      this.#rotateRowsInPlace(delta, rotated);
    } else {
      this.#rotateRowsThroughFragment(delta, rotated);
    }

    if (!focusedInBand) {
      return null;
    }

    // A band that shrinks on the same draw drops the TRs past `nextSize` in `start()`, and a
    // leaving row that wrapped to that end goes with them. A dropped element cannot take the focus
    // back, and the grid would lose the browser focus with it. Keep the focused row's TR inside the
    // band instead: swap it with the last surviving slot, whose row then repaints into this element
    // (its stamp names another element), exactly as a stationary grid keeps the focused element and
    // paints another row into it.
    const focusedRow = this.#rowOf(focusedElement as HTMLElement);
    const focusedIndex = focusedRow === null ? -1 : Array.prototype.indexOf.call(rootNode.children, focusedRow);

    if (focusedRow !== null && focusedIndex >= nextSize) {
      const survivor = rootNode.children[nextSize - 1];
      const after = focusedRow.nextSibling;

      moveRow(rootNode, focusedRow, survivor, movesInPlace);
      moveRow(rootNode, survivor, after, movesInPlace);
    }

    return focusedElement as HTMLElement;
  }

  /**
   * Rotates the rows that left the band to its other end one by one, with `moveBefore()`, so that no
   * row is detached on the way. The order matches `#rotateRowsThroughFragment`.
   *
   * @param {number} delta The change of the band's offset.
   * @param {number} rotated The number of rows that leave the band.
   */
  #rotateRowsInPlace(delta: number, rotated: number) {
    const rootNode = this.rootNode as HTMLElement;

    if (delta > 0) {
      for (let i = 0; i < rotated; i++) {
        moveRow(rootNode, rootNode.firstElementChild!, null, true);
      }

      return;
    }

    for (let i = 0; i < rotated; i++) {
      moveRow(rootNode, rootNode.lastElementChild!, rootNode.firstChild, true);
    }
    for (let i = rotated; i < -delta; i++) {
      rootNode.insertBefore(this.nodesPool!.obtain() as HTMLElement, rootNode.firstChild);
    }
  }

  /**
   * Rotates the rows that left the band to its other end through a document fragment, which detaches
   * them for the length of the move.
   *
   * @param {number} delta The change of the band's offset.
   * @param {number} rotated The number of rows that leave the band.
   */
  #rotateRowsThroughFragment(delta: number, rotated: number) {
    const rootNode = this.rootNode as HTMLElement;
    const fragment = rootNode.ownerDocument.createDocumentFragment();

    if (delta > 0) {
      // Scrolled down: the first `delta` rows left the band – send them to the bottom, in order.
      for (let i = 0; i < rotated; i++) {
        fragment.appendChild(rootNode.firstElementChild!);
      }
      rootNode.appendChild(fragment);

      return;
    }

    // Scrolled up: the rows past the new band's end left it – send them to the top, in order.
    for (let i = 0; i < rotated; i++) {
      fragment.insertBefore(rootNode.lastElementChild!, fragment.firstChild);
    }
    for (let i = rotated; i < -delta; i++) {
      fragment.insertBefore(this.nodesPool!.obtain() as HTMLElement, fragment.firstChild);
    }
    rootNode.insertBefore(fragment, rootNode.firstChild);
  }

  /**
   * Returns the TR of this TBODY that holds the element, crossing the shadow boundary of a
   * web-component cell through the element's shadow hosts; `null` when no TR of this TBODY holds it.
   *
   * @param {HTMLElement} element The focused element.
   * @returns {HTMLElement|null}
   */
  #rowOf(element: HTMLElement): HTMLElement | null {
    const rootNode = this.rootNode as HTMLElement;
    const lightNode = rootNode.contains(element) ?
      element :
      getShadowHostChain(element).find(host => rootNode.contains(host));
    const row = lightNode?.closest('tr') ?? null;

    return row !== null && row.parentNode === rootNode ? row as HTMLElement : null;
  }
}

/**
 * Tells whether the engine can move a connected element inside the TBODY without detaching it
 * (`Element#moveBefore()`). A detached focused cell makes Firefox and WebKit blur it, and the rows
 * renderer then focuses it again while it shows another row; a screen reader takes that `focus` event
 * as a move and jumps its reading cursor to that row. A move that never detaches the cell keeps the
 * focus where it is, so no event fires. The method is newer than the browser floor, so it is detected.
 *
 * @param {HTMLElement} rootNode The TBODY.
 * @returns {boolean}
 */
function canMoveWithoutDetaching(rootNode: HTMLElement): boolean {
  return typeof rootNode.moveBefore === 'function';
}

/**
 * Moves a row of the TBODY before the reference node, without detaching it when `inPlace` is set.
 *
 * @param {HTMLElement} rootNode The TBODY.
 * @param {Element} row The row to move.
 * @param {Node|null} referenceNode The node to move the row before; `null` moves it to the end.
 * @param {boolean} inPlace `true` to move with `moveBefore()`, `false` to move with `insertBefore()`.
 */
function moveRow(rootNode: HTMLElement, row: Element, referenceNode: Node | null, inPlace: boolean) {
  if (inPlace) {
    rootNode.moveBefore(row, referenceNode);
  } else {
    rootNode.insertBefore(row, referenceNode);
  }
}
