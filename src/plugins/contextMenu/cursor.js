
import {getWindowScrollLeft, getWindowScrollTop,} from './../../helpers/dom/element';
import {pageX, pageY} from './../../helpers/dom/event';

/**
 * Helper class for checking if element will fit at the desired side of cursor.
 *
 * @class Cursor
 * @plugin ContextMenu
 */
class Cursor {
  constructor(object) {
    let windowScrollTop = getWindowScrollTop();
    let windowScrollLeft = getWindowScrollLeft();
    let top, topRelative;
    let left, leftRelative;
    let scrollTop, scrollLeft;
    let cellHeight, cellWidth;

    this.type = this.getSourceType(object);

    /* jshint -W020 */
    if (this.type === 'literal') {
      top = parseInt(object.top, 10);
      left = parseInt(object.left, 10);
      cellHeight = object.height;
      cellWidth = object.width;

    } else if (this.type === 'event') {
      top = parseInt(pageY(object), 10);
      left = parseInt(pageX(object), 10);
      cellHeight = object.target.clientHeight;
      cellWidth = object.target.clientWidth;
    }
    topRelative = top - windowScrollTop;
    leftRelative = left - windowScrollLeft;
    scrollTop = windowScrollTop;
    scrollLeft = windowScrollLeft;

    this.top = top;
    this.topRelative = topRelative;
    this.left = left;
    this.leftRelative = leftRelative;
    this.scrollTop = scrollTop;
    this.scrollLeft = scrollLeft;
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;
  }

  /**
   * Get source type name.
   *
   * @param {*} object Event or Object with coordinates.
   * @returns {String} Returns one of this values: `'literal'`, `'event'`.
   */
  getSourceType(object) {
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
   * @returns {Boolean}
   */
  fitsAbove(element) {
    return this.topRelative >= element.offsetHeight;
  }

  /**
   * Checks if element can be placed below the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit below the cursor.
   * @param {Number} [viewportHeight]
   * @returns {Boolean}
   */
  fitsBelow(element, viewportHeight = window.innerHeight) {
    return this.topRelative + element.offsetHeight <= viewportHeight;
  }

  /**
   * Checks if element can be placed on the right of the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit on the right of the cursor.
   * @param {Number} [viewportWidth]
   * @returns {Boolean}
   */
  fitsOnRight(element, viewportWidth = window.innerWidth) {
    return this.leftRelative + this.cellWidth + element.offsetWidth <= viewportWidth;
  }

  /**
   * Checks if element can be placed on the left on the cursor.
   *
   * @param {HTMLElement} element Element to check if it's size will fit on the left of the cursor.
   * @returns {Boolean}
   */
  fitsOnLeft(element) {
    return this.leftRelative >= element.offsetWidth;
  }
}

export {Cursor};

// temp for tests only!
Handsontable.plugins.utils = Handsontable.plugins.utils || {};
Handsontable.plugins.utils.Cursor = Cursor;
