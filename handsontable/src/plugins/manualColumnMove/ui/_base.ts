import type { HotInstance } from '../../../core/types';
import { isNumeric } from '../../../helpers/number';
import { toUpperCaseFirst } from '../../../helpers/string';

const STATE_INITIALIZED = 0;
const STATE_BUILT = 1;
const STATE_APPENDED = 2;
const UNIT = 'px';

/**
 * @class
 * @private
 */
class BaseUI {
  /**
   * Instance of Handsontable.
   *
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * DOM element representing the ui element.
   *
   * @type {HTMLElement}
   * @private
   */
  _element: HTMLElement | null = null;
  /**
   * Flag which determines build state of element.
   *
   * @type {number}
   */
  state = STATE_INITIALIZED;
  /**
   * Defines the "start" physical CSS property name used within the class depending on what document
   * layout direction the library runs.
   *
   * @type {string}
   */
  declare inlineProperty: 'left' | 'right';

  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.inlineProperty = hotInstance.isRtl() ? 'right' : 'left';
  }

  /**
   * Add created UI elements to table.
   *
   * @param {HTMLElement} wrapper Element which are parent for our UI element.
   */
  appendTo(wrapper: HTMLElement) {
    wrapper.appendChild(this._element!);

    this.state = STATE_APPENDED;
  }

  /**
   * Method for create UI element. Only create, without append to table.
   */
  build() {
    if (this.state !== STATE_INITIALIZED) {
      return;
    }

    this._element = this.hot.rootDocument.createElement('div');
    this.state = STATE_BUILT;
  }

  /**
   * Method for remove UI element.
   */
  destroy() {
    if (this.isAppended()) {
      this._element!.parentElement?.removeChild(this._element!);
    }

    this._element = null;
    this.state = STATE_INITIALIZED;
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

  /**
   * Setter for position.
   *
   * @param {number} top New top position of the element.
   * @param {number} inlinePosition New left/right (depends on LTR/RTL document mode) position of the element.
   */
  setPosition(top?: number, inlinePosition?: number) {
    if (isNumeric(top)) {
      this._element!.style.top = top + UNIT;
    }
    if (isNumeric(inlinePosition)) {
      this._element!.style[this.inlineProperty] = inlinePosition + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {object} Object contains left and top position of the element.
   */
  getPosition() {
    const style = this._element!.style;

    return {
      top: style.top ? Number.parseInt(style.top, 10) : 0,
      start: style[this.inlineProperty] ? Number.parseInt(style[this.inlineProperty], 10) : 0
    };
  }

  /**
   * Setter for the element size.
   *
   * @param {number} width New width of the element.
   * @param {number} height New height of the element.
   */
  setSize(width?: number, height?: number) {
    if (isNumeric(width)) {
      this._element!.style.width = width + UNIT;
    }
    if (isNumeric(height)) {
      this._element!.style.height = height + UNIT;
    }
  }

  /**
   * Getter for the element position.
   *
   * @returns {object} Object contains height and width of the element.
   */
  getSize() {
    return {
      width: this._element!.style.width ? Number.parseInt(this._element!.style.width, 10) : 0,
      height: this._element!.style.height ? Number.parseInt(this._element!.style.height, 10) : 0
    };
  }

  /**
   * Setter for the element offset. Offset means marginTop and marginLeft of the element.
   *
   * @param {number} top New margin top of the element.
   * @param {number} inlineOffset New margin left/right (depends on LTR/RTL document mode) of the element.
   */
  setOffset(top: number, inlineOffset: number) {
    if (isNumeric(top)) {
      this._element!.style.marginTop = top + UNIT;
    }
    if (isNumeric(inlineOffset)) {
      const marginProp = `margin${toUpperCaseFirst(this.inlineProperty)}` as 'marginLeft' | 'marginRight';

      this._element!.style[marginProp] = inlineOffset + UNIT;
    }
  }

  /**
   * Getter for the element offset.
   *
   * @returns {object} Object contains top and left offset of the element.
   */
  getOffset() {
    const style = this._element!.style;
    const inlineProp = `margin${toUpperCaseFirst(this.inlineProperty)}` as 'marginLeft' | 'marginRight';

    return {
      top: style.marginTop ? Number.parseInt(style.marginTop, 10) : 0,
      start: style[inlineProp] ? Number.parseInt(style[inlineProp], 10) : 0
    };
  }
}

export default BaseUI;
