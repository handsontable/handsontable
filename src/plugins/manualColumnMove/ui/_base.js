import { isNumeric } from './../../../helpers/number';

const STATE_INITIALIZED = 0;
const STATE_BUILT = 1;
const STATE_APPENDED = 2;
const UNIT = 'px';

/**
 * @class
 * @private
 */
class BaseUI {
  constructor(hotInstance) {
    /**
     * Instance of Handsontable.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * DOM element representing the ui element.
     *
     * @type {HTMLElement}
     * @private
     */
    this._element = null;
    /**
     * Flag which determines build state of element.
     *
     * @type {Boolean}
     */
    this.state = STATE_INITIALIZED;
  }

  /**
   * Add created UI elements to table.
   *
   * @param {HTMLElement} wrapper Element which are parent for our UI element.
   */
  appendTo(wrapper) {
    wrapper.appendChild(this._element);

    this.state = STATE_APPENDED;
  }

  /**
   * Method for create UI element. Only create, without append to table.
   */
  build() {
    this._element = this.hot.rootDocument.createElement('div');
    this.state = STATE_BUILT;
  }

  /**
   * Method for remove UI element.
   */
  destroy() {
    if (this.isAppended()) {
      this._element.parentElement.removeChild(this._element);
    }

    this._element = null;
    this.state = STATE_INITIALIZED;
  }

  /**
   * Check if UI element are appended.
   *
   * @returns {Boolean}
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
   * @param {Number} top New top position of the element.
   * @param {Number} left New left position of the element.
   */
  setPosition(top, left) {
    if (isNumeric(top)) {
      this._element.style.top = top + UNIT;
    }
    if (isNumeric(left)) {
      this._element.style.left = left + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {Object} Object contains left and top position of the element.
   */
  getPosition() {
    return {
      top: this._element.style.top ? parseInt(this._element.style.top, 10) : 0,
      left: this._element.style.left ? parseInt(this._element.style.left, 10) : 0
    };
  }

  /**
   * Setter for the element size.
   *
   * @param {Number} width New width of the element.
   * @param {Number} height New height of the element.
   */
  setSize(width, height) {
    if (isNumeric(width)) {
      this._element.style.width = width + UNIT;
    }
    if (isNumeric(height)) {
      this._element.style.height = height + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {Object} Object contains height and width of the element.
   */
  getSize() {
    return {
      width: this._element.style.width ? parseInt(this._element.style.width, 10) : 0,
      height: this._element.style.height ? parseInt(this._element.style.height, 10) : 0
    };
  }

  /**
   * Setter for the element offset. Offset means marginTop and marginLeft of the element.
   *
   * @param {Number} top New margin top of the element.
   * @param {Number} left New margin left of the element.
   */
  setOffset(top, left) {
    if (isNumeric(top)) {
      this._element.style.marginTop = top + UNIT;
    }
    if (isNumeric(left)) {
      this._element.style.marginLeft = left + UNIT;
    }
  }

  /**
   * Getter for the element offset.
   *
   * @returns {Object} Object contains top and left offset of the element.
   */
  getOffset() {
    return {
      top: this._element.style.marginTop ? parseInt(this._element.style.marginTop, 10) : 0,
      left: this._element.style.marginLeft ? parseInt(this._element.style.marginLeft, 10) : 0
    };
  }
}

export default BaseUI;
