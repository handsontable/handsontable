
import {getWindowScrollLeft, getWindowScrollTop,} from './../../helpers/dom/element';
import {pageX, pageY} from './../../helpers/dom/event';

/**
 * @class Cursor
 * @private
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
    if (this.type === 'client_rect' || this.type === 'literal') {
      top = object.top;
      left = object.left;
      cellHeight = object.height;
      cellWidth = object.width;

    } else if (this.type === 'event') {
      top = pageY(object);
      left = pageX(object);
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
   * @param {*} object
   * @returns {String}
   */
  getSourceType(object) {
    let type = 'literal';

    if (object instanceof ClientRect) {
      type = 'client_rect';

    } else if (object instanceof Event) {
      type = 'event';
    }

    return type;
  }

  /**
   * Checks if element can be placed above the cursor.
   *
   * @param {HTMLElement} element
   * @returns {Boolean}
   */
  isFitsAbove(element) {
    return this.topRelative >= element.offsetHeight;
  }

  /**
   * Checks if element can be placed below the cursor.
   *
   * @param {HTMLElement} element
   * @param {Number} [viewportHeight]
   * @returns {Boolean}
   */
  isFitsBelow(element, viewportHeight = window.innerHeight) {
    return this.topRelative + element.offsetHeight <= viewportHeight;
  }

  /**
   * Checks if element can be placed on the right of the cursor.
   *
   * @param {HTMLElement} element
   * @param {Number} [viewportWidth]
   * @returns {Boolean}
   */
  isFitsOnRight(element, viewportWidth = window.innerWidth) {
    return this.leftRelative + element.offsetWidth <= viewportWidth;
  }

  /**
   * Checks if element can be placed on the left on the cursor.
   *
   * @param {HTMLElement} element
   * @returns {Boolean}
   */
  isFitsOnLeft(element) {
    return this.leftRelative >= element.offsetWidth;
  }
}

export {Cursor};

// temp for tests only!
Handsontable.plugins.utils = Handsontable.plugins.utils || {};
Handsontable.plugins.utils.Cursor = Cursor;
