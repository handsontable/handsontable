import { Cursor } from './cursor';

/**
 * Helper class for positioning the menu and submenus in the correct place relative to the
 * cursor position (DOM element or mouse coordinates).
 *
 * @private
 * @class Positioner
 */
export class Positioner {
  /**
   * The menu container element the positioning will be applied to.
   *
   * @type {HTMLElement}
   */
  #container;
  /**
   * For positioning the submenu, the parent element is used to calculate offsets to ensure that submenu
   * is positioned right next to the parent menu.
   *
   * @type {HTMLElement}
   */
  #parentContainer;
  /**
   * The instance of the Cursor class.
   *
   * @type {Cursor}
   */
  #cursor;
  /**
   * Enabling the option allows changing the position calculation so that the menus (or submenus)
   * are always placed within the visible viewport of the browser.
   *
   * @type {boolean}
   */
  #keepInViewport = false;
  /**
   * Allows apply the position offset for directions.
   *
   * @type {{above: number, below: number, left: number, right: number}}
   */
  #offset = {
    above: 0,
    below: 0,
    left: 0,
    right: 0,
  };

  constructor(keepInViewport) {
    this.#keepInViewport = keepInViewport;
  }

  /**
   * Sets offset position for specified directions (`above`, `below`, `left` or `right`).
   *
   * @param {'above' | 'below' | 'left' | 'right'} direction A direction name.
   * @param {number} [offset=0] Offset value.
   * @returns {Positioner}
   */
  setOffset(direction, offset = 0) {
    this.#offset[direction] = offset;

    return this;
  }

  /**
   * Sets the menu element to work with. The element can be owned by the main menu or the submenu.
   *
   * @param {HTMLElement} container The menu container element.
   * @returns {Positioner}
   */
  setElement(container) {
    this.#container = container;

    return this;
  }

  /**
   * Sets the parent menu element to work with.
   *
   * @param {HTMLElement} container The parent menu container element.
   * @returns {Positioner}
   */
  setParentElement(container) {
    this.#parentContainer = container;

    return this;
  }

  /**
   * Updates the menu position.
   *
   * @param {object|MouseEvent} coords The literal object with `top`, `left`, `width` and `height` props or a
   * mouse event object.
   */
  updatePosition(coords) {
    this.#cursor = new Cursor(coords, this.#container.ownerDocument.defaultView);

    if (this.#keepInViewport) {
      if (this.#cursor.fitsBelow(this.#container)) {
        this.setPositionBelowCursor();

      } else if (this.#cursor.fitsAbove(this.#container)) {
        this.setPositionAboveCursor();

      } else {
        this.setPositionBelowCursor();
      }

      this.updateHorizontalPosition();
    } else {
      this.setPositionBelowCursor();
      this.setPositionOnRightOfCursor();
    }
  }

  /**
   * Updates the menu horizontal position.
   */
  updateHorizontalPosition() {
    if (this.#container.dir === 'rtl') {
      if (this.#cursor.fitsOnLeft(this.#container)) {
        this.setPositionOnLeftOfCursor();
      } else {
        this.setPositionOnRightOfCursor();
      }

    } else if (this.#cursor.fitsOnRight(this.#container)) {
      this.setPositionOnRightOfCursor();

    } else {
      this.setPositionOnLeftOfCursor();
    }
  }

  /**
   * Sets the menu position above the cursor object.
   */
  setPositionAboveCursor() {
    let top = this.#offset.above + this.#cursor.top - this.#container.offsetHeight;

    if (this.#parentContainer) {
      top = this.#cursor.top + this.#cursor.cellHeight - this.#container.offsetHeight + 3;
    }

    this.#container.style.top = `${top}px`;
  }

  /**
   * Sets the menu position below the cursor object.
   */
  setPositionBelowCursor() {
    let top = this.#offset.below + this.#cursor.top + 1;

    if (this.#parentContainer) {
      top = this.#cursor.top - 1;
    }

    this.#container.style.top = `${top}px`;
  }

  /**
   * Sets the menu position on the right of the cursor object.
   */
  setPositionOnRightOfCursor() {
    let left = this.#cursor.left;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView;
      const borderRightWidth = Number.parseInt(rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.htCore')).borderRightWidth, 10);

      left += this.#cursor.cellWidth + borderRightWidth;
    } else {
      left += this.#offset.right;
    }

    this.#container.style.left = `${left}px`;
  }

  /**
   * Sets the menu position on the left of the cursor object.
   */
  setPositionOnLeftOfCursor() {
    let left = this.#offset.left + this.#cursor.left - this.#container.offsetWidth;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView;
      const borderLeftWidth = Number.parseInt(rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.htCore')).borderLeftWidth, 10);

      left -= borderLeftWidth;
    }

    this.#container.style.left = `${left}px`;
  }
}
