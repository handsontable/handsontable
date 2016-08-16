const STATE_APPENDED = 1;
const STATE_BUILT = 2;

class BaseUI {
  constructor(hotInstance) {
    this.hot = hotInstance;

    this.parent = void 0;
    /**
     * DOM element representing the move handle.
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
   * @returns {boolean}
   */
  isBuilt() {
    return this.state >= STATE_BUILT;
  }
}

export {BaseUI};
