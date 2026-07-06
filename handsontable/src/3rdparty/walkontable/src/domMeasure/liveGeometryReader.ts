import {
  offset,
  outerWidth,
  outerHeight,
  innerHeight,
  innerWidth,
  getScrollbarWidth,
  getStyle,
  getMaximumScrollTop,
  getMaximumScrollLeft,
} from '../../../../helpers/dom/element';
import type { GeometryReader } from './geometryReader';

/**
 * The live (uncached) implementation of {@link GeometryReader}.
 *
 * Element-property reads return the property directly; measurement reads delegate to the shared
 * `helpers/dom/element` functions. The class is stateless and holds no cache, so it reads the same
 * values at the same time as the previous inline reads — it changes structure, not behavior.
 *
 * @class LiveGeometryReader
 */
export class LiveGeometryReader implements GeometryReader {
  /**
   * The window used to resolve computed styles.
   */
  readonly #rootWindow: Window;

  /**
   * @param {Window} rootWindow The window used to resolve computed styles.
   */
  constructor(rootWindow: Window) {
    this.#rootWindow = rootWindow;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  clientWidth(element: HTMLElement): number {
    return element.clientWidth;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  clientHeight(element: HTMLElement): number {
    return element.clientHeight;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetWidth(element: HTMLElement): number {
    return element.offsetWidth;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetHeight(element: HTMLElement): number {
    return element.offsetHeight;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetTop(element: HTMLElement): number {
    return element.offsetTop;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  offsetLeft(element: HTMLElement): number {
    return element.offsetLeft;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {HTMLElement | null}
   */
  offsetParent(element: HTMLElement): HTMLElement | null {
    return element.offsetParent as HTMLElement | null;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  scrollWidth(element: HTMLElement): number {
    return element.scrollWidth;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  scrollHeight(element: HTMLElement): number {
    return element.scrollHeight;
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {DOMRect}
   */
  getBoundingClientRect(element: HTMLElement): DOMRect {
    return element.getBoundingClientRect();
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  outerWidth(element: HTMLElement): number {
    return outerWidth(element);
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {number}
   */
  outerHeight(element: HTMLElement): number {
    return outerHeight(element);
  }

  /**
   * @param {HTMLElement | Window} element The element (or window) to measure.
   * @returns {number}
   */
  innerHeight(element: HTMLElement | Window): number {
    return innerHeight(element);
  }

  /**
   * @param {HTMLElement | Window} element The element (or window) to measure.
   * @returns {number}
   */
  innerWidth(element: HTMLElement | Window): number {
    return innerWidth(element);
  }

  /**
   * @param {HTMLElement} element The element to measure.
   * @returns {{ left: number, top: number }}
   */
  offset(element: HTMLElement): { left: number, top: number } {
    return offset(element);
  }

  /**
   * Forwards the optional document argument verbatim to preserve the exact behavior of each call
   * site (some pass the root document, some rely on the helper's default global document).
   *
   * @param {Document} [rootDocument] The document used to measure the scrollbar.
   * @returns {number}
   */
  getScrollbarWidth(rootDocument?: Document): number {
    return getScrollbarWidth(rootDocument);
  }

  /**
   * @param {HTMLElement} element The element to read.
   * @returns {CSSStyleDeclaration}
   */
  getComputedStyle(element: HTMLElement): CSSStyleDeclaration {
    return this.#rootWindow.getComputedStyle(element);
  }

  /**
   * @param {HTMLElement} element The element to read.
   * @param {string} property The CSS property name.
   * @returns {string | undefined}
   */
  getStyle(element: HTMLElement, property: string): string | undefined {
    return getStyle(element, property, this.#rootWindow);
  }

  /**
   * @param {HTMLElement} element The element to read.
   * @returns {number}
   */
  getMaximumScrollTop(element: HTMLElement): number {
    return getMaximumScrollTop(element);
  }

  /**
   * @param {HTMLElement} element The element to read.
   * @returns {number}
   */
  getMaximumScrollLeft(element: HTMLElement): number {
    return getMaximumScrollLeft(element);
  }
}
