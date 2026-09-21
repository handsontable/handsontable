import {
  getDeepActiveElement,
  getShadowHostChain,
  isHTMLElement,
} from '../../../../helpers/dom/element';
import { OVERLAY_RAIL_CLASS_NAME } from './constants';

/**
 * Where a clone sits on the block (vertical) axis inside its rail.
 *
 * `pinned` means the window owns that axis, so the clone travels it and the rail spans the table's
 * height. Otherwise the rail has no height and hangs where the clone stood.
 */
export type RailBlockPlacement =
  | { pinned: true, edge: 'top' | 'bottom' }
  | { pinned: false, edge: 'top' }
  | { pinned: false, edge: 'bottom', offset: number, height: number };

/**
 * What a clone's rail must span, and which axes the clone travels inside it.
 */
export type RailPlacement = {
  /** Whether the grid is right-to-left, so the inline-start edge is the right one. */
  isRtl: boolean;
  /** The master table's total width – the inline span a pinned clone may travel. */
  width: number;
  /** The master table's total height – the block span a pinned clone may travel. */
  height: number;
  /** Whether the clone travels the inline axis (the window owns it). */
  inline: boolean;
  /** Where the clone sits on the block axis. */
  block: RailBlockPlacement;
};

/**
 * Whether a rail already carries the offset of the axis an overlay names.
 *
 * An overlay that names NO axis gets `false`: the question is about one axis, and there is none to
 * answer for, so the caller keeps the whole offset rather than the answer for some other axis. The
 * corners are that case – their clone travels both axes, and a rail may hold either one.
 *
 * @param {OverlayRail | null} rail The overlay's rail, if it has one.
 * @param {'inline' | 'block' | null} axis The axis the overlay follows.
 * @returns {boolean}
 */
export function railCarriesAxis(rail: OverlayRail | null, axis: 'inline' | 'block' | null): boolean {
  if (rail === null || axis === null) {
    return false;
  }

  return axis === 'inline' ? rail.pinsInline() : rail.pinsBlock();
}

/**
 * Keeps an overlay clone at the viewport's edge with CSS while the WINDOW scrolls the grid
 * (DEV-127 for the inline axis, DEV-126 for the block axis).
 *
 * The browser scrolls the page on its compositor, without waiting for JavaScript. A clone moved
 * from a `scroll` listener – a transform or an inset written after the event – is therefore painted
 * one step behind the page: on about every other frame of a wheel scroll the row headers were torn
 * away from the edge, or the column headers were missing altogether, in every engine.
 * `position: sticky` is resolved by the browser on the scroll's own frame, so a sticky clone cannot
 * fall behind.
 *
 * A sticky box only travels inside its parent's box, and every ancestor of the clones is as large as
 * the viewport, not as the table. Pinned where it stands, a clone would stop after one viewport
 * width or height. So the clone is moved into a "rail": an absolutely positioned box that spans the
 * table on each axis the clone travels, holding only that clone, at the clone's old slot among the
 * master's siblings. A rail takes no pointer events; the clone inside it takes its own again.
 *
 * Two consequences for readers of a clone's position, both measured on Chromium, Firefox and WebKit:
 * - a sticky shift IS part of the layout, so `offsetLeft`/`offsetTop` and the `offset()` helper see
 *   it, where they never saw the transform. A reader that walks that chain and then adds the overlay
 *   offset on top counts the scroll twice – see `Overlay#getOverlayTransformOffset`;
 * - the clone is no longer a sibling of the master while pinned, so a stylesheet rule that reaches the
 *   clones through `.ht_master ~` must also reach them through the rail.
 */
export class OverlayRail {
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
   * Whether the clone travels the inline axis inside the rail.
   *
   * @type {boolean}
   */
  #pinsInline = false;
  /**
   * Whether the clone travels the block axis inside the rail.
   *
   * @type {boolean}
   */
  #pinsBlock = false;

  /**
   * @param {HTMLElement} clone The clone root element.
   * @param {Document} rootDocument The document the grid lives in.
   */
  constructor(clone: HTMLElement, rootDocument: Document) {
    this.#clone = clone;
    this.#rootDocument = rootDocument;
  }

  /**
   * Whether the clone currently sits in this rail.
   *
   * @returns {boolean}
   */
  isPinned(): boolean {
    return this.#rail !== null;
  }

  /**
   * Whether the browser, not the scroll listener, holds the clone on the inline axis.
   *
   * @returns {boolean}
   */
  pinsInline(): boolean {
    return this.#pinsInline;
  }

  /**
   * Whether the browser, not the scroll listener, holds the clone on the block axis.
   *
   * @returns {boolean}
   */
  pinsBlock(): boolean {
    return this.#pinsBlock;
  }

  /**
   * Puts the clone in its rail, or updates the rail of a clone already in one.
   *
   * @param {RailPlacement} placement What the rail spans and which axes the clone travels.
   */
  pin(placement: RailPlacement): void {
    const { isRtl, width, height, inline, block } = placement;

    if (!inline && !block.pinned) {
      // Nothing to hold the clone with; it belongs back where the clone factory put it.
      this.release();

      return;
    }

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
    // An inset on the axis the clone travels is its sticky constraint; on the other axis it would be
    // one too, so the rail carries that axis's place itself.
    cloneStyle[start] = inline ? '0' : '';
    cloneStyle[end] = '';
    cloneStyle.top = '';
    cloneStyle.bottom = '';

    if (block.pinned) {
      railStyle.top = '0';
      railStyle.bottom = '';
      railStyle.height = `${height}px`;
      cloneStyle[block.edge] = '0';
      // A sticky box only shifts from where it would otherwise stand, and inside the rail that is the
      // rail's top. A `bottom` inset engages only once the clone's own place is the rail's BOTTOM, so
      // the rail pushes it there. `flex-start` keeps the clone at its own width: a stretched clone
      // would take the rail's full table width.
      railStyle.display = block.edge === 'bottom' ? 'flex' : '';
      railStyle.flexDirection = block.edge === 'bottom' ? 'column' : '';
      railStyle.alignItems = block.edge === 'bottom' ? 'flex-start' : '';
      cloneStyle.marginTop = block.edge === 'bottom' ? 'auto' : '';

    } else if (block.edge === 'top') {
      railStyle.top = '0';
      railStyle.bottom = '';
      railStyle.height = '0';
      this.#clearBottomFlow(railStyle, cloneStyle);

    } else {
      // The rail has no height, so its bottom edge is also the line the clone's top hangs from.
      railStyle.top = '';
      railStyle.bottom = `${block.offset + block.height}px`;
      railStyle.height = '0';
      this.#clearBottomFlow(railStyle, cloneStyle);
    }

    this.#pinsInline = inline;
    this.#pinsBlock = block.pinned;
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
    this.#pinsInline = false;
    this.#pinsBlock = false;
    cloneStyle.position = 'absolute';
    cloneStyle.top = '0';
    // The clone factory leaves the bottom edge to the content, and a released clone gets its `top`
    // back: an absolutely positioned box carrying BOTH insets is stretched to its container instead
    // of shrinking to its table, so a bottom overlay that stops rendering would still measure the
    // whole grid (`core/batch.spec.js` catches it). The bottom overlays write their own inset again
    // on the next draw that needs one.
    cloneStyle.bottom = '';
    cloneStyle.pointerEvents = '';
    cloneStyle.marginTop = '';
  }

  /**
   * Puts a rail that no longer hangs its clone from the bottom back into ordinary flow.
   *
   * @param {CSSStyleDeclaration} railStyle The rail's style.
   * @param {CSSStyleDeclaration} cloneStyle The clone's style.
   */
  #clearBottomFlow(railStyle: CSSStyleDeclaration, cloneStyle: CSSStyleDeclaration): void {
    railStyle.display = '';
    railStyle.flexDirection = '';
    railStyle.alignItems = '';
    cloneStyle.marginTop = '';
  }

  /**
   * Creates the rail in the clone's slot and moves the clone into it.
   *
   * @returns {HTMLElement} The rail element.
   */
  #createRail(): HTMLElement {
    const clone = this.#clone;
    const rail = this.#rootDocument.createElement('div');

    rail.className = OVERLAY_RAIL_CLASS_NAME;
    rail.style.position = 'absolute';
    rail.style.height = '0';
    // A rail that spans the table covers the cells under the clone; it must not take their clicks,
    // and the clone must keep taking its own.
    rail.style.pointerEvents = 'none';
    clone.before(rail);
    this.#moveClone(() => rail.appendChild(clone));
    clone.style.position = 'sticky';
    clone.style.pointerEvents = 'auto';
    this.#rail = rail;

    return rail;
  }

  /**
   * Moves the clone into or out of the rail, keeping the focus on an element inside it. The move
   * detaches the clone for a moment, and an engine that blurs a detached element at once would drop
   * the focus to the body – the focus manager focuses the topmost copy of a cell, which for a
   * frozen-column, header or corner cell is in this clone. Only while the document has the focus, as
   * in `render/rows.ts`.
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
