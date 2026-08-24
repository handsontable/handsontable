import { eventTargetEl } from '../../../helpers/dom/element';

interface CursorSourceLiteral {
  top: string | number;
  left: string | number;
  height?: number;
  width?: number;
}

interface CursorSourceEvent extends Event {
  pageY: number;
  pageX: number;
  target: HTMLElement;
}

/**
 * Helper class for checking if element will fit at the desired side of cursor.
 *
 * @private
 * @class Cursor
 */
export class Cursor {
  /**
   * @type {number}
   */
  top;
  /**
   * @type {number}
   */
  topRelative;
  /**
   * @type {number}
   */
  left;
  /**
   * @type {number}
   */
  leftRelative;
  /**
   * @type {number}
   */
  scrollTop;
  /**
   * @type {number}
   */
  scrollLeft;
  /**
   * @type {number}
   */
  cellHeight;
  /**
   * @type {number}
   */
  cellWidth;
  /**
   * Reference to the root window used for reading scroll offsets and dimensions.
   */
  declare rootWindow: Window;
  /**
   * Indicates the source type of the cursor position: either `'literal'` or `'event'`.
   */
  declare type: string;

  /**
   * Initializes the cursor position by computing coordinates from either a literal object or a DOM event.
   */
  constructor(object: CursorSourceLiteral | Event, rootWindow: Window) {
    const windowScrollTop = rootWindow.scrollY;
    const windowScrollLeft = rootWindow.scrollX;
    let top = 0;
    let topRelative = 0;
    let left = 0;
    let leftRelative = 0;
    let cellHeight = 0;
    let cellWidth = 0;

    this.rootWindow = rootWindow;
    this.type = this.getSourceType(object);

    if (this.type === 'literal') {
      const literal = object as CursorSourceLiteral;

      top = parseInt(String(literal.top), 10);
      left = parseInt(String(literal.left), 10);
      cellHeight = literal.height || 0;
      cellWidth = literal.width || 0;
      topRelative = top;
      leftRelative = left;
      top += windowScrollTop;
      left += windowScrollLeft;

    } else if (this.type === 'event') {
      const evt = object as CursorSourceEvent;

      top = parseInt(String(evt.pageY), 10);
      left = parseInt(String(evt.pageX), 10);
      cellHeight = eventTargetEl(evt)!.clientHeight;
      cellWidth = eventTargetEl(evt)!.clientWidth;
      topRelative = top - windowScrollTop;
      leftRelative = left - windowScrollLeft;
    }

    this.top = top;
    this.topRelative = topRelative;
    this.left = left;
    this.leftRelative = leftRelative;
    this.scrollTop = windowScrollTop;
    this.scrollLeft = windowScrollLeft;
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;
  }

  /**
   * Get source type name.
   *
   * @param {*} object Event or Object with coordinates.
   * @returns {string} Returns one of this values: `'literal'`, `'event'`.
   */
  getSourceType(object: CursorSourceLiteral | Event) {
    let type = 'literal';

    if (object instanceof Event) {
      type = 'event';
    }

    return type;
  }

  /**
   * Checks if element can be placed above the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit above the cursor.
   * @returns {boolean}
   */
  fitsAbove(element: HTMLElement) {
    return this.topRelative >= element.offsetHeight;
  }

  /**
   * Checks if element can be placed below the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit below the cursor.
   * @param {number} [viewportHeight] The viewport height.
   * @returns {boolean}
   */
  fitsBelow(element: HTMLElement, viewportHeight = this.rootWindow.innerHeight) {
    return this.topRelative + element.offsetHeight <= viewportHeight;
  }

  /**
   * Checks if element can be placed on the right of the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit on the right of the cursor.
   * @param {number} [viewportWidth] The viewport width.
   * @returns {boolean}
   */
  fitsOnRight(element: HTMLElement, viewportWidth = this.rootWindow.document.documentElement.clientWidth) {
    return this.leftRelative + this.cellWidth + element.offsetWidth <= viewportWidth;
  }

  /**
   * Checks if element can be placed on the left on the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit on the left of the cursor.
   * @returns {boolean}
   */
  fitsOnLeft(element: HTMLElement) {
    return this.leftRelative >= element.offsetWidth;
  }
}
