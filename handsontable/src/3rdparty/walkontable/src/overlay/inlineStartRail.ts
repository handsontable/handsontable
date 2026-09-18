import {
  getDeepActiveElement,
  getShadowHostChain,
  isHTMLElement,
} from '../../../../helpers/dom/element';
import { INLINE_START_RAIL_CLASS_NAME } from './constants';

/**
 * Where a pinned clone sits vertically inside the grid's wrapper.
 */
export type RailVerticalAnchor =
  | { edge: 'top' }
  | { edge: 'bottom', offset: number, height: number };

/**
 * Keeps one overlay clone at the viewport's inline-start edge with CSS while the WINDOW scrolls the
 * grid sideways (DEV-127).
 *
 * The browser scrolls the page on its compositor, without waiting for JavaScript. A clone moved
 * from a `scroll` listener – a transform or an inset written after the event – is therefore painted
 * one step behind the page: on about every other frame of a wheel scroll the row headers were torn
 * away from the edge or missing altogether, in every engine. `position: sticky` is resolved by the
 * browser on the same frame as the scroll, so a sticky clone cannot fall behind.
 *
 * A sticky box only travels inside its parent's box, and every ancestor of the clones is as wide as
 * the viewport, not as the table – pinned where it stands, a clone would stop after one viewport
 * width. So the clone is moved into a "rail": an absolutely positioned box as wide as the whole table,
 * holding nothing else, with no height of its own (so it covers nothing and takes no pointer
 * events), at the vertical place the clone had. Inside it the clone is `position: sticky` with its
 * inline-start inset at 0.
 *
 * Two consequences for readers of the clone's position, both measured on Chromium, Firefox and WebKit:
 * - a sticky shift IS part of the layout, so `offsetLeft` and the `offset()` helper see it, where they
 *   never saw the transform. A reader that walks that chain and then adds the overlay offset on top
 *   counts the scroll twice – see `Overlay#getOverlayTransformOffset`;
 * - the clone is no longer a sibling of the master while pinned, so a stylesheet rule that reaches the
 *   clones through `.ht_master ~` must also reach them through the rail.
 */
export class InlineStartRail {
  /**
   * The clone root element this rail pins.
   *
   * @type {HTMLElement}
   */
  readonly #clone: HTMLElement;
  /**
   * The document the rail is created in.
   *
   * @type {Document}
   */
  readonly #rootDocument: Document;
  /**
   * The rail element, while the clone is pinned.
   *
   * @type {HTMLElement | null}
   */
  #rail: HTMLElement | null = null;

  /**
   * @param {HTMLElement} clone The clone root element.
   * @param {Document} rootDocument The document the grid lives in.
   */
  constructor(clone: HTMLElement, rootDocument: Document) {
    this.#clone = clone;
    this.#rootDocument = rootDocument;
  }

  /**
   * Whether the clone is currently pinned by this rail.
   *
   * @returns {boolean}
   */
  isPinned(): boolean {
    return this.#rail !== null;
  }

  /**
   * Pins the clone, or updates a pinned clone's rail.
   *
   * @param {number} width The width the clone may travel along – the whole table.
   * @param {boolean} isRtl Whether the grid is right-to-left (the inline-start edge is the right one).
   * @param {RailVerticalAnchor} anchor Where the clone sits vertically.
   */
  pin(width: number, isRtl: boolean, anchor: RailVerticalAnchor): void {
    const clone = this.#clone;
    let rail = this.#rail;

    if (rail === null) {
      if (!clone.parentNode) {
        return;
      }

      rail = this.#createRail();
    }

    const [start, end] = isRtl ? ['right', 'left'] as const : ['left', 'right'] as const;
    const railStyle = rail.style;
    const cloneStyle = clone.style;

    railStyle.width = `${width}px`;
    railStyle[start] = '0';
    railStyle[end] = '';
    // The inline-start inset is the sticky constraint; any vertical inset would be one too.
    cloneStyle[start] = '0';
    cloneStyle[end] = '';
    cloneStyle.top = '';
    cloneStyle.bottom = '';

    if (anchor.edge === 'top') {
      railStyle.top = '0';
      railStyle.bottom = '';
    } else {
      // The rail has no height, so its bottom edge is also the line the clone's top hangs from.
      railStyle.top = '';
      railStyle.bottom = `${anchor.offset + anchor.height}px`;
    }
  }

  /**
   * Puts the clone back where the rail stands, positioned as the clone factory created it.
   */
  release(): void {
    const rail = this.#rail;

    if (rail === null) {
      return;
    }

    const cloneStyle = this.#clone.style;

    this.#moveClone(() => rail.replaceWith(this.#clone));
    this.#rail = null;
    cloneStyle.position = 'absolute';
    cloneStyle.top = '0';
  }

  /**
   * Creates the rail in the clone's slot and moves the clone into it.
   *
   * @returns {HTMLElement} The rail element.
   */
  #createRail(): HTMLElement {
    const clone = this.#clone;
    const rail = this.#rootDocument.createElement('div');

    rail.className = INLINE_START_RAIL_CLASS_NAME;
    rail.style.position = 'absolute';
    rail.style.height = '0';
    clone.before(rail);
    this.#moveClone(() => rail.appendChild(clone));
    clone.style.position = 'sticky';
    this.#rail = rail;

    return rail;
  }

  /**
   * Moves the clone into or out of the rail, keeping the focus on an element inside it. The move
   * detaches the clone for a moment, and an engine that blurs a detached element at once would drop
   * the focus to the body – the focus manager focuses the topmost copy of a cell, which for a
   * frozen-column or row-header cell is in this clone. Only while the document has the focus, as in
   * `render/rows.ts`.
   *
   * @param {Function} move The DOM move.
   */
  #moveClone(move: () => void): void {
    const clone = this.#clone;
    const rootDocument = this.#rootDocument;
    const focused = rootDocument.hasFocus() ? getDeepActiveElement(rootDocument) : null;
    const focusedInClone = isHTMLElement(focused) && (
      clone.contains(focused) ||
      getShadowHostChain(focused).some(host => clone.contains(host))
    ) ? focused : null;

    move();

    if (focusedInClone !== null && getDeepActiveElement(rootDocument) !== focusedInClone) {
      focusedInClone.focus({ preventScroll: true });
    }
  }
}
