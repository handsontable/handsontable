import { addClass, removeClass, setAttribute } from '../../../helpers/dom/element';
import { A11Y_DISABLED } from '../../../helpers/a11y';

/**
 * Slack, in pixels, allowed at either end before an arrow counts as having run out of strip.
 * Scroll offsets and element widths are both fractional, so an exact comparison would leave an
 * arrow enabled at a position it cannot move away from.
 *
 * @type {number}
 */
const SCROLL_END_TOLERANCE = 1;

/**
 * The class an arrow wears when it has run out of strip in its direction. It is the source of
 * truth for the disabled state — `aria-disabled` only mirrors it, and only while the `ariaTags`
 * setting keeps ARIA on — so `isArrowEnabled()` and the bar's focus walk read this class.
 *
 * @type {string}
 */
export const DISABLED_CLASS = 'ht-sheets-bar__button--disabled';

/**
 * Watches the tab strip for horizontal overflow and drives the paging arrows.
 * The strip itself scrolls with a hidden scrollbar; the arrows appear only while
 * `scrollWidth > clientWidth` and the `paging` setting is enabled, and each one is disabled
 * once the strip has no more room to give in its direction.
 */
export class OverflowController {
  /**
   * The scrollable tab strip element.
   */
  readonly #strip: HTMLElement;
  /**
   * The paging arrows section.
   */
  readonly #pagingSection: HTMLElement;
  /**
   * The arrow that scrolls the strip back toward its first tab.
   */
  readonly #pagePrev: HTMLButtonElement;
  /**
   * The arrow that scrolls the strip on toward its last tab.
   */
  readonly #pageNext: HTMLButtonElement;
  /**
   * Whether paging arrows are allowed at all.
   */
  readonly #pagingEnabled: boolean;
  /**
   * RTL flag — flips the scroll delta sign.
   */
  readonly #isRtl: boolean;
  /**
   * Whether ARIA attributes may be written at all — the grid's `ariaTags` setting.
   */
  readonly #ariaTags: boolean;
  /**
   * Observes strip size changes.
   */
  #resizeObserver: ResizeObserver | null = null;
  /**
   * The pending animation frame deferring a resize-driven refresh, so it can be canceled on
   * teardown.
   */
  #refreshFrame: number | null = null;

  /**
   * Wires the controller to the strip and arrow elements.
   */
  constructor({ strip, pagingSection, pagePrev, pageNext, pagingEnabled, isRtl, ariaTags }: {
    strip: HTMLElement,
    pagingSection: HTMLElement,
    pagePrev: HTMLButtonElement,
    pageNext: HTMLButtonElement,
    pagingEnabled: boolean,
    isRtl: boolean,
    ariaTags: boolean,
  }) {
    this.#strip = strip;
    this.#pagingSection = pagingSection;
    this.#pagePrev = pagePrev;
    this.#pageNext = pageNext;
    this.#pagingEnabled = pagingEnabled;
    this.#isRtl = isRtl;
    this.#ariaTags = ariaTags;

    pagePrev.addEventListener('click', () => this.#scrollByStep(-1));
    pageNext.addEventListener('click', () => this.#scrollByStep(1));
  }

  /**
   * Whether an arrow has strip left to scroll.
   *
   * @param {HTMLButtonElement} arrow The arrow to test.
   * @returns {boolean} `true` when a press would move the strip.
   */
  isArrowEnabled(arrow: HTMLButtonElement): boolean {
    return !arrow.classList.contains(DISABLED_CLASS);
  }

  /**
   * Starts observing the strip for size and content changes. The observer's refresh is
   * deferred to the next animation frame: `refresh()` toggles the paging section, which
   * changes the observed strip's own width in the same flex row — a synchronous write to
   * observed geometry from inside the observer's callback (the same reason
   * StretchColumns defers its ResizeObserver work).
   */
  attach(): void {
    this.#resizeObserver = new ResizeObserver(() => {
      const view = this.#strip.ownerDocument.defaultView;

      if (this.#refreshFrame !== null || !view) {
        return;
      }

      this.#refreshFrame = view.requestAnimationFrame(() => {
        this.#refreshFrame = null;
        this.refresh();
      });
    });
    this.#resizeObserver.observe(this.#strip);
    this.#strip.addEventListener('scroll', this.#onScroll);
    this.refresh();
  }

  /**
   * Recomputes arrow visibility from the current overflow state, and whether each arrow still
   * has strip left to scroll.
   *
   * Overflow is measured against the width the strip would have with the paging section
   * hidden. The arrows take their room from the strip itself, so measuring the shrunken strip
   * would keep them shown once tabs fit again without them — a state they could never leave.
   */
  refresh(): void {
    const pagingWidth = this.#pagingSection.hidden ? 0 : this.#pagingSection.offsetWidth;
    const overflows = this.#strip.scrollWidth > this.#strip.clientWidth + pagingWidth;

    this.#pagingSection.hidden = !(this.#pagingEnabled && overflows);

    // Distance travelled from the first tab. Under RTL the strip scrolls into negative
    // `scrollLeft`, so the magnitude is what both ends have in common.
    const travelled = Math.abs(this.#strip.scrollLeft);
    const total = this.#strip.scrollWidth - this.#strip.clientWidth;

    this.#setArrowEnabled(this.#pagePrev, travelled > SCROLL_END_TOLERANCE);
    this.#setArrowEnabled(this.#pageNext, travelled < total - SCROLL_END_TOLERANCE);
  }

  /**
   * Marks an arrow as spent or live. The mark is `aria-disabled` rather than `disabled`: a
   * keyboard user pressing an arrow until the end has the focus on it at that moment, and a
   * disabled element drops the focus onto the document body.
   *
   * @param {HTMLButtonElement} arrow The arrow.
   * @param {boolean} enabled Whether it still has strip to scroll.
   */
  #setArrowEnabled(arrow: HTMLButtonElement, enabled: boolean): void {
    if (this.#ariaTags) {
      setAttribute(arrow, [A11Y_DISABLED(!enabled)]);
    }

    if (enabled) {
      removeClass(arrow, DISABLED_CLASS);
    } else {
      addClass(arrow, DISABLED_CLASS);
    }
  }

  /**
   * Stops observing.
   */
  destroy(): void {
    if (this.#refreshFrame !== null) {
      this.#strip.ownerDocument.defaultView?.cancelAnimationFrame(this.#refreshFrame);
      this.#refreshFrame = null;
    }

    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#strip.removeEventListener('scroll', this.#onScroll);
  }

  /**
   * Re-evaluates the arrows whenever the strip moves — by an arrow, a drag at the edge, or a
   * newly activated sheet being scrolled into view.
   */
  #onScroll = (): void => {
    this.refresh();
  };

  /**
   * Scrolls the strip by one viewport step in the given direction (mirrored in RTL).
   */
  #scrollByStep(direction: number): void {
    if (!this.isArrowEnabled(direction < 0 ? this.#pagePrev : this.#pageNext)) {
      return;
    }

    const delta = direction * this.#strip.clientWidth * (this.#isRtl ? -1 : 1);

    this.#strip.scrollLeft += delta;
  }
}
