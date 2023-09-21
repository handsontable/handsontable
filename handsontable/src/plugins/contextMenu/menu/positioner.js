import { Cursor } from './cursor';

/**
 * Helper class for positioning the menu and submenus in the correct place based on the
 * cursor position.
 *
 * @private
 * @class Positioner
 */
export class Positioner {
  #container;
  #parentContainer;
  #cursor;
  #keepInViewport = false;
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
   * Set offset position for specified area (`above`, `below`, `left` or `right`).
   *
   * @param {string} area Specified area name (`above`, `below`, `left` or `right`).
   * @param {number} offset Offset value.
   */
  setOffset(area, offset = 0) {
    this.#offset[area] = offset;

    return this;
  }

  setContext(container) {
    this.#container = container;

    return this;
  }

  setParentContext(container) {
    this.#parentContainer = container;

    return this;
  }

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

      this.setHorizontalPosition();
    } else {
      this.setPositionBelowCursor();
      this.setPositionOnRightOfCursor();
    }
  }

  /**
   * Set menu horizontal position.
   */
  setHorizontalPosition() {
    if (this.#container.dir === 'rtl') {
      if (this.#cursor.fitsOnLeft(this.#container)) {
        this.setPositionOnLeftOfCursor();
      } else {
        this.setPositionOnRightOfCursor();
      }
    } else {
      if (this.#cursor.fitsOnRight(this.#container)) {
        this.setPositionOnRightOfCursor();
      } else {
        this.setPositionOnLeftOfCursor();
      }
    }
  }

  /**
   * Set menu position above cursor object.
   */
  setPositionAboveCursor() {
    let top = this.#offset.above + this.#cursor.top - this.#container.offsetHeight;

    if (this.#parentContainer) {
      top = this.#cursor.top + this.#cursor.cellHeight - this.#container.offsetHeight + 3;
    }

    this.#container.style.top = `${top}px`;
  }

  /**
   * Set menu position below cursor object.
   */
  setPositionBelowCursor() {
    let top = this.#offset.below + this.#cursor.top + 1;

    if (this.#parentContainer) {
      top = this.#cursor.top - 1;
    }

    this.#container.style.top = `${top}px`;
  }

  /**
   * Set menu position on the right of cursor object.
   */
  setPositionOnRightOfCursor() {
    let left = this.#cursor.left;

    if (this.#parentContainer) {
      const { right: parentMenuRight } = this.#parentContainer.getBoundingClientRect();

      // move the sub menu by the width of the parent's border (usually by 1-2 pixels)
      left += this.#cursor.cellWidth + parentMenuRight - (this.#cursor.left + this.#cursor.cellWidth);
    } else {
      left += this.#offset.right;
    }

    this.#container.style.left = `${left}px`;
  }

  /**
   * Set menu position on the left of cursor object.
   */
  setPositionOnLeftOfCursor() {
    let left = this.#offset.left + this.#cursor.left - this.#container.offsetWidth;

    if (this.#parentContainer) {
      const { left: parentMenuLeft } = this.#parentContainer.getBoundingClientRect();

      // move the sub menu by the width of the parent's border (usually by 1-2 pixels)
      left -= this.#cursor.left - parentMenuLeft;
    }

    this.#container.style.left = `${left}px`;
  }
}
