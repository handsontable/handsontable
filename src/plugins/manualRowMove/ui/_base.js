const STATE_APPENDED = 1;
const STATE_BUILT = 2;
const UNIT = 'px';

class BaseUI {
  constructor(hotInstance) {
    this.hot = hotInstance;
    /**
     * DOM element representing parent for ui element.
     */
    this.parent = void 0;
    /**
     * DOM element representing the ui element.
     *
     * @type {HTMLElement}
     */
    this.element = null;
    /**
     * State of the ui element.
     * @type {boolean}
     */
    this.state = 0;
  }

  /**
   * Add created UI elements to table.
   *
   * @param {HTMLElement} wrapper Element which are parent for our UI element.
   */
  appendTo(wrapper) {
    this.wrapper = wrapper;

    this.wrapper.appendChild(this.element);

    this.state = STATE_APPENDED;
  }

  /**
   * Method for create UI element. Only create, without append to table.
   */
  build() {
    this.element = document.createElement('div');
    this.state = STATE_BUILT;
  }

  /**
   * Method for remove UI element.
   */
  destroy() {
    if (this.isAppended()) {
      this.parent.removeChild(this.element);

    } else if (this.isBuilt()) {
      let toRemove = document.createElement('div');

      toRemove.appendChild(this.element);

      document.body.appendChild(toRemove);
      document.body.removeChild(toRemove);
    }

    this.state = 0;
  }

  /**
   * Check if UI element are appended.
   *
   * @returns {boolean}
   */
  isAppended() {
    return this.state === STATE_APPENDED;
  }

  /**
   * Check if UI element are built.
   *
   * @returns {Boolean}
   */
  isBuilt() {
    return this.state >= STATE_BUILT;
  }

  /**
   * Setter for position.
   *
   * @param {Number} top
   * @param {Number} left
   */
  setPosition(top, left) {
    if (top) {
      this.element.style.top = top + UNIT;
    }
    if (left) {
      this.element.style.left = left + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {Object} Object contains left and top position of the element.
   */
  getPosition() {
    return {
      top: this.element.style.top ? parseInt(this.element.style.top, 10) : 0,
      left: this.element.style.left ? parseInt(this.element.style.left, 10) : 0
    };
  }

  /**
   * Setter for the element size.
   *
   * @param width
   * @param height
   */
  setSize(width, height) {
    if (width) {
      this.element.style.width = width + UNIT;
    }
    if (height) {
      this.element.style.height = height + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {Object} Object contains height and width of the element.
   */
  getSize() {
    return {
      width: this.element.style.width ? parseInt(this.element.style.width, 10) : 0,
      height: this.element.style.height ? parseInt(this.element.style.height, 10) : 0
    };
  }

  /**
   * Setter for the element offset. Offset means marginTop and marginLeft of the element.
   *
   * @param {Number} top
   * @param {Number} left
   */
  setOffset(top, left) {
    if (top) {
      this.element.style.marginTop = top + UNIT;
    }
    if (left) {
      this.element.style.marginLeft = left + UNIT;
    }
  }

  /**
   * Getter for the element offset.
   * @returns {Object} Object contains top and left offset of the element.
   */
  getOffset() {
    return {
      top: this.element.style.marginTop ? parseInt(this.element.style.marginTop, 10) : 0,
      left: this.element.style.marginLeft ? parseInt(this.element.style.marginLeft, 10) : 0
    };
  }
}

export {BaseUI};
