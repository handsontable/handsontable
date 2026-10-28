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
  #container: HTMLElement | null = null;
  /**
   * For positioning the submenu, the parent element is used to calculate offsets to ensure that submenu
   * is positioned right next to the parent menu.
   *
   * @type {HTMLElement}
   */
  #parentContainer: HTMLElement | null = null;
  /**
   * The instance of the Cursor class.
   *
   * @type {Cursor}
   */
  #cursor: Cursor | null = null;
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
  #offset: Record<string, number> = {
    above: 0,
    below: 0,
    left: 0,
    right: 0,
  };

  /**
   * Initializes the positioner with a flag indicating whether the menu should be kept within the viewport boundaries.
   */
  constructor(keepInViewport: boolean) {
    this.#keepInViewport = keepInViewport;
  }

  /**
   * Sets offset position for specified directions (`above`, `below`, `left` or `right`).
   *
   * @param {'above' | 'below' | 'left' | 'right'} direction A direction name.
   * @param {number} [offset=0] Offset value.
   * @returns {Positioner}
   */
  setOffset(direction: string, offset = 0) {
    this.#offset[direction] = offset;

    return this;
  }

  /**
   * Sets the menu element to work with. The element can be owned by the main menu or the submenu.
   *
   * @param {HTMLElement} container The menu container element.
   * @returns {Positioner}
   */
  setElement(container: HTMLElement) {
    this.#container = container;

    return this;
  }

  /**
   * Sets the parent menu element to work with.
   *
   * @param {HTMLElement} container The parent menu container element.
   * @returns {Positioner}
   */
  setParentElement(container: HTMLElement) {
    this.#parentContainer = container;

    return this;
  }

  /**
   * Updates the menu position.
   *
   * @param {object|MouseEvent} coords The literal object with `top`, `left`, `width` and `height` props or a
   * mouse event object.
   */
  updatePosition(coords: Event | DOMRect | Record<string, unknown>) {
    this.#cursor = new Cursor(coords as Event, this.#container!.ownerDocument.defaultView as Window);

    if (this.#keepInViewport) {
      if (this.#cursor.fitsBelow(this.#container!)) {
        this.setPositionBelowCursor();

      } else if (this.#cursor.fitsAbove(this.#container!)) {
        this.setPositionAboveCursor();

      } else {
        this.setPositionBelowCursor();
      }

      this.#clampVertically();
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
    if (this.#container!.dir === 'rtl') {
      if (this.#cursor!.fitsOnLeft(this.#container!)) {
        this.setPositionOnLeftOfCursor();
      } else {
        this.setPositionOnRightOfCursor();
      }

    } else if (this.#cursor!.fitsOnRight(this.#container!)) {
      this.setPositionOnRightOfCursor();

    } else {
      this.setPositionOnLeftOfCursor();
    }

    this.#clampHorizontally();
  }

  /**
   * Sets the menu position above the cursor object.
   */
  setPositionAboveCursor() {
    let top = this.#offset.above + this.#cursor!.top - this.#container!.offsetHeight;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView as Window;
      const style = rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.ht_master') as Element);
      const paddingTop = Number.parseInt(style.paddingTop, 10);
      const borderTop = Number.parseInt(style.borderTop, 10);

      top = this.#cursor!.top + this.#cursor!.cellHeight -
        this.#container!.scrollHeight + paddingTop + borderTop;
    }

    this.#container!.style.top = `${top}px`;
  }

  /**
   * Sets the menu position below the cursor object.
   */
  setPositionBelowCursor() {
    let top = this.#offset.below + this.#cursor!.top + 1;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView as Window;
      const style = rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.ht_master') as Element);
      const paddingTop = Number.parseInt(style.paddingTop, 10);
      const borderTop = Number.parseInt(style.borderTop, 10);

      top = this.#cursor!.top - paddingTop - borderTop;
    }

    this.#container!.style.top = `${top}px`;
  }

  /**
   * Sets the menu position on the right of the cursor object.
   */
  setPositionOnRightOfCursor() {
    let left = this.#cursor!.left;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView as Window;
      const borderRightWidth = Number.parseInt(rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.htCore') as Element).borderRightWidth, 10);

      left += this.#cursor!.cellWidth + borderRightWidth;
    } else {
      left += this.#offset.right;
    }

    this.#container!.style.left = `${left}px`;
  }

  /**
   * Sets the menu position on the left of the cursor object.
   */
  setPositionOnLeftOfCursor() {
    let left = this.#offset.left + this.#cursor!.left - this.#container!.offsetWidth;

    if (this.#parentContainer) {
      const rootWindow = this.#parentContainer.ownerDocument.defaultView as Window;
      const borderLeftWidth = Number.parseInt(rootWindow.getComputedStyle(this.#parentContainer
        .querySelector('.htCore') as Element).borderLeftWidth, 10);

      left -= borderLeftWidth;
    }

    this.#container!.style.left = `${left}px`;
  }

  /**
   * Moves the menu back inside the viewport when the side it was placed on leaves it. The side is
   * chosen from the room on one side of the cursor, so a menu that fits on neither side of it ends
   * up past the viewport's edge. The check runs on the position written to `style.left`, which is in
   * page coordinates, so the viewport's edges are the window's scroll offset and that offset plus the
   * viewport's width. A menu wider than the viewport keeps its inline-start edge visible.
   */
  #clampHorizontally() {
    const container = this.#container!;
    const { scrollLeft, rootWindow } = this.#cursor!;
    const viewportWidth = rootWindow.document.documentElement.clientWidth;
    const minLeft = scrollLeft;
    const maxLeft = scrollLeft + viewportWidth - container.offsetWidth;
    const left = Number.parseFloat(container.style.left);
    const clampedLeft = clampIntoRange(left, minLeft, maxLeft, container.dir !== 'rtl');

    if (clampedLeft !== left) {
      container.style.left = `${clampedLeft}px`;
    }
  }

  /**
   * Moves the menu back inside the viewport when neither the room below the cursor nor the room above
   * it fits the menu, which `updatePosition()` answers by placing it below anyway. The check runs on
   * the position written to `style.top`, which is in page coordinates, so the viewport's edges are the
   * window's scroll offset and that offset plus the viewport's height, the height `Cursor#fitsBelow()`
   * uses. A menu taller than the viewport keeps its top edge visible.
   */
  #clampVertically() {
    const container = this.#container!;
    const { scrollTop, rootWindow } = this.#cursor!;
    const minTop = scrollTop;
    const maxTop = scrollTop + rootWindow.innerHeight - container.offsetHeight;
    const top = Number.parseFloat(container.style.top);
    const clampedTop = clampIntoRange(top, minTop, maxTop, true);

    if (clampedTop !== top) {
      container.style.top = `${clampedTop}px`;
    }
  }
}

/**
 * Limits a position to the range a menu may start in. A range whose maximum is below its minimum is
 * a menu larger than the viewport: the bound listed last wins, so `preferMin` keeps the menu's
 * start edge at the minimum, and its absence keeps the menu's end edge at the maximum.
 *
 * @param {number} value The position to limit.
 * @param {number} min The lowest position that keeps the menu's start edge in the viewport.
 * @param {number} max The highest position that keeps the menu's end edge in the viewport.
 * @param {boolean} preferMin Whether the minimum wins when the range is empty.
 * @returns {number} The position inside the range, or the preferred bound when there is none.
 */
function clampIntoRange(value: number, min: number, max: number, preferMin: boolean) {
  return preferMin ?
    Math.max(min, Math.min(value, max)) :
    Math.min(max, Math.max(value, min));
}
