/**
 * Reads geometric measurements from the DOM.
 *
 * Every layout-forcing DOM read in the rendering engine goes through this port instead of reading
 * element properties (`clientHeight`, `offsetWidth`, …) directly. Centralizing the reads here is the
 * seam a caching layer can later slot into: a future adapter can memoize measurements per draw
 * without changing any call site.
 *
 * The only adapter today is `LiveGeometryReader` — a stateless pass-through that reads straight from
 * the DOM and holds no cache, so it introduces no behavior change.
 *
 * The contract currently covers the reads used by the viewport calculations. It grows as more
 * modules are routed through the port; only methods matched to a real call site are declared.
 *
 * @interface GeometryReader
 */
export interface GeometryReader {
  /**
   * Reads `element.clientWidth`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  clientWidth(element: HTMLElement): number;

  /**
   * Reads `element.clientHeight`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  clientHeight(element: HTMLElement): number;

  /**
   * Reads `element.offsetWidth`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetWidth(element: HTMLElement): number;

  /**
   * Reads `element.offsetHeight`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetHeight(element: HTMLElement): number;

  /**
   * Reads `element.offsetTop`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetTop(element: HTMLElement): number;

  /**
   * Reads `element.offsetLeft`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetLeft(element: HTMLElement): number;

  /**
   * Reads `element.offsetParent`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {HTMLElement | null}
   */
  offsetParent(element: HTMLElement): HTMLElement | null;

  /**
   * Reads `element.scrollWidth`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  scrollWidth(element: HTMLElement): number;

  /**
   * Reads `element.scrollHeight`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  scrollHeight(element: HTMLElement): number;

  /**
   * Reads `element.getBoundingClientRect()`.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {DOMRect}
   */
  getBoundingClientRect(element: HTMLElement): DOMRect;

  /**
   * Returns the element width including borders (the `outerWidth` DOM helper).
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  outerWidth(element: HTMLElement): number;

  /**
   * Returns the element height including borders (the `outerHeight` DOM helper).
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  outerHeight(element: HTMLElement): number;

  /**
   * Returns the element height without borders (the `innerHeight` DOM helper).
   *
   * @param {HTMLElement | Window} element The element (or window) to measure.
   * @returns {number}
   */
  innerHeight(element: HTMLElement | Window): number;

  /**
   * Returns the element width without borders (the `innerWidth` DOM helper).
   *
   * @param {HTMLElement | Window} element The element (or window) to measure.
   * @returns {number}
   */
  innerWidth(element: HTMLElement | Window): number;

  /**
   * Returns the element offset relative to the document (the `offset` DOM helper).
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {{ left: number, top: number }}
   */
  offset(element: HTMLElement): { left: number, top: number };

  /**
   * Returns the browser scrollbar width (the `getScrollbarWidth` DOM helper). The document argument
   * is optional and forwarded verbatim so existing call sites keep their exact behavior — some pass
   * the root document, some rely on the helper's default.
   *
   * @param {Document} [rootDocument] The document used to measure the scrollbar.
   * @returns {number}
   */
  getScrollbarWidth(rootDocument?: Document): number;

  /**
   * Returns the element's resolved computed style (`rootWindow.getComputedStyle`).
   *
   * @param {Element} element The element to read.
   * @returns {CSSStyleDeclaration}
   */
  getComputedStyle(element: Element): CSSStyleDeclaration;

  /**
   * Returns a single resolved computed-style property (the `getStyle` DOM helper).
   *
   * @param {HTMLElement} element The element to read.
   * @param {string} property The CSS property name.
   * @returns {string | undefined}
   */
  getStyle(element: HTMLElement, property: string): string | undefined;

  /**
   * Returns the element's maximum vertical scroll offset (the `getMaximumScrollTop` DOM helper).
   *
   * @param {HTMLElement} element The element to read.
   * @returns {number}
   */
  getMaximumScrollTop(element: HTMLElement): number;

  /**
   * Returns the element's maximum horizontal scroll offset (the `getMaximumScrollLeft` DOM helper).
   *
   * @param {HTMLElement} element The element to read.
   * @returns {number}
   */
  getMaximumScrollLeft(element: HTMLElement): number;
}
