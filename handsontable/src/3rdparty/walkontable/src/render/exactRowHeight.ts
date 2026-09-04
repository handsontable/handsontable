/**
 * Applies a resolved row height to a rendered `<tr>`.
 *
 * Two shapes, chosen per row by the row-size source's mode (`RowUtils#isExact`):
 *
 * - Floor (the historical shape): the height is written to the row's first cell only. A table
 *   cell's `height` is a minimum in CSS table layout, so the row still grows when any cell's
 *   content is taller, and the oversized-rows measurement then records the real height.
 * - Exact: the row gets the `htExactRow` class, the height is written to ONE cell (the first that
 *   spans a single row), and each data cell's content is moved into a `div.htCellClip` wrapper.
 *   The stylesheet addresses the cells through the row class: it releases their default minimum
 *   height (so the one cell carrying the height decides the row), drops their padding, and takes
 *   the wrapper out of flow (absolutely positioned over the cell's padding box, `overflow: hidden`),
 *   which is the only way a table cell can be shorter than its text. Row headers keep their own
 *   `.relative` wrapper; the row class alone lets the stylesheet clip it.
 *
 * The marker sits on the row, not on the cells, on purpose: the cell renderers reset every cell's
 * class and inline style on each draw, and re-marking every cell made the browser recompute the
 * style of the whole band on every draw. The row renderer leaves the row's class alone, so the
 * class is written once and the per-draw work is one inline height per row (the same write the
 * floor shape makes) plus one property read per data cell to confirm its wrapper is in place.
 *
 * The wrapper is kept across draws because the built-in renderers write through
 * `getCellContentRoot()`. A renderer that wipes the cell costs one re-wrap per draw, on exact rows
 * only.
 */
import {
  addClass,
  hasClass,
  isHTMLElement,
  removeClass,
  CELL_CLIP_CLASS,
} from '../../../../helpers/dom/element';
import { getBoxAdjustedRowHeight } from '../axisSizing/boxModel';

/**
 * The class an exact-height row carries. The stylesheet keys the clipping on it.
 *
 * @type {string}
 */
export const EXACT_ROW_CLASS = 'htExactRow';

/**
 * The rows currently rendered in the exact shape, so a row that switches back to the floor shape
 * (a settings change, or a reused row element) gets its wrappers removed once, instead of every
 * floor row being inspected on every draw.
 */
const exactRows = new WeakSet<HTMLElement>();

/**
 * Whether the node is the engine's clipping wrapper.
 *
 * @param {Node|null} node The node to test.
 * @returns {boolean}
 */
function isClipWrapper(node: Node | null): node is HTMLElement {
  return isHTMLElement(node) && hasClass(node, CELL_CLIP_CLASS);
}

/**
 * Makes sure the cell's content sits inside exactly one clipping wrapper, which is the cell's only
 * child. A wrapper that is already in place costs one property read. Otherwise the existing wrapper
 * is reused when one is found among the children (a renderer inserted a node next to it), or a new
 * one is created, and every other child is moved inside in document order.
 *
 * @param {HTMLElement} TD The data cell.
 */
function ensureClipWrapper(TD: HTMLElement): void {
  const firstChild = TD.firstChild;

  if (isClipWrapper(firstChild) && firstChild.nextSibling === null) {
    return;
  }

  const children = Array.from(TD.childNodes);
  let wrapper = children.find(isClipWrapper);

  if (wrapper === undefined) {
    wrapper = TD.ownerDocument.createElement('div');
    wrapper.className = CELL_CLIP_CLASS;
  }

  const anchor = wrapper.firstChild;
  let beforeWrapper = true;

  children.forEach((node) => {
    if (node === wrapper) {
      beforeWrapper = false;

      return;
    }

    if (beforeWrapper) {
      wrapper.insertBefore(node, anchor);
    } else {
      wrapper.appendChild(node);
    }
  });

  if (wrapper.parentNode !== TD) {
    TD.appendChild(wrapper);
  }
}

/**
 * Moves the cell's content back out of the clipping wrapper and removes the wrapper.
 *
 * @param {HTMLElement} TD The data cell.
 */
function removeClipWrapper(TD: HTMLElement): void {
  const wrapper = TD.firstChild;

  if (!isClipWrapper(wrapper)) {
    return;
  }

  while (wrapper.firstChild) {
    TD.insertBefore(wrapper.firstChild, wrapper);
  }

  TD.removeChild(wrapper);
}

/**
 * Applies the exact shape: the class on the row (once), the height on the first cell that spans a
 * single row, the wrapper in every data cell. A cell spanning several rows (a merged cell) never
 * carries the height — a single row's height is meaningless for it and the span's rows size it —
 * but it is still wrapped, so content taller than the whole span is clipped to the span.
 *
 * @param {HTMLElement} TR The row element.
 * @param {string} pixelHeight The height to write, as a CSS length.
 */
function applyExactShape(TR: HTMLElement, pixelHeight: string): void {
  if (!exactRows.has(TR)) {
    addClass(TR, EXACT_ROW_CLASS);
    exactRows.add(TR);
  }

  const cells = TR.children;
  let heightCarrier: HTMLElement | null = null;

  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];

    if (!isHTMLElement(cell)) {
      continue; // eslint-disable-line no-continue
    }

    if (heightCarrier === null && Number(cell.getAttribute('rowspan') ?? 1) <= 1) {
      heightCarrier = cell;
    }

    if (cell.tagName === 'TD') {
      ensureClipWrapper(cell);
    }
  }

  if (heightCarrier !== null) {
    heightCarrier.style.height = pixelHeight;
  }
}

/**
 * Undoes the exact shape on a row that is back on the floor path: the row class and the wrappers.
 * The inline height needs no care — the cell renderers reset it on every draw, and the floor path
 * writes its own.
 *
 * @param {HTMLElement} TR The row element.
 */
function releaseExactShape(TR: HTMLElement): void {
  const cells = TR.children;

  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];

    if (isHTMLElement(cell) && cell.tagName === 'TD') {
      removeClipWrapper(cell);
    }
  }

  removeClass(TR, EXACT_ROW_CLASS);
  exactRows.delete(TR);
}

/**
 * Applies the resolved height of one rendered row to its DOM. Runs after the cells rendered, on
 * every draw, and again whenever the engine re-applies heights out of a render (the frozen-column
 * row sync).
 *
 * @param {HTMLElement} TR The row element.
 * @param {number|undefined} rowHeight The LOGICAL row height (including the bottom border), or
 *   `undefined`/`0` when no height applies and the row sizes to its content.
 * @param {boolean} isExact Whether the row renders at exactly `rowHeight` (see `RowUtils#isExact`).
 * @param {boolean} isBorderBox Whether the cells use `box-sizing: border-box`.
 */
export function applyRowHeight(
  TR: HTMLElement,
  rowHeight: number | undefined,
  isExact: boolean,
  isBorderBox: boolean,
): void {
  const firstChild = TR.firstChild;

  if (!isHTMLElement(firstChild)) {
    return;
  }

  // Convert the logical row height to the pixel height written to the DOM. In content-box mode
  // 1px is "replaced" by the row's 1px top border; the shared helper keeps that constant in one
  // place (see axisSizing/boxModel.ts).
  const pixelHeight = rowHeight ? `${getBoxAdjustedRowHeight(rowHeight, isBorderBox)}px` : '';

  if (isExact && rowHeight) {
    applyExactShape(TR, pixelHeight);

    return;
  }

  firstChild.style.height = pixelHeight;

  if (exactRows.has(TR)) {
    releaseExactShape(TR);
  }
}
