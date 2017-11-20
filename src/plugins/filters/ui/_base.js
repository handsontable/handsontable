import {clone, extend, mixin, objectEach, isObject} from 'handsontable/helpers/object';
import {isFunction} from 'handsontable/helpers/function';
import localHooks from 'handsontable/mixins/localHooks';
import EventManager from 'handsontable/eventManager';
import {addClass} from 'handsontable/helpers/dom/element';
import {arrayEach} from 'handsontable/helpers/array';

const STATE_BUILT = 'built';
const STATE_BUILDING = 'building';
const EVENTS_TO_REGISTER = ['click', 'input', 'keydown', 'keypress', 'keyup', 'focus', 'blur', 'change'];

/**
 * @class
 * @private
 */
class BaseUI {
  static get DEFAULTS() {
    return clone({
      className: '',
      value: '',
      tagName: 'div',
      children: [],
      wrapIt: true,
    });
  }

  constructor(hotInstance, options) {
    /**
     * Instance of Handsontable.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * Instance of EventManager.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * List of element options.
     *
     * @type {Object}
     */
    this.options = extend(BaseUI.DEFAULTS, options);
    /**
     * Build root DOM element.
     *
     * @type {Element}
     * @private
     */
    this._element = document.createElement(this.options.wrapIt ? 'div' : this.options.tagName);
    /**
     * Flag which determines build state of element.
     *
     * @type {Boolean}
     */
    this.buildState = false;
  }

  /**
   * Set the element value.
   *
   * @returns {*}
   */
  setValue(value) {
    this.options.value = value;
    this.update();
  }

  /**
   * Get the element value.
   *
   * @returns {*}
   */
  getValue() {
    return this.options.value;
  }

  /**
   * Get element as a DOM object.
   *
   * @returns {Element}
   */
  get element() {
    if (this.buildState === STATE_BUILDING) {
      return this._element;
    }
    if (this.buildState === STATE_BUILT) {
      this.update();

      return this._element;
    }
    this.buildState = STATE_BUILDING;
    this.build();
    this.buildState = STATE_BUILT;

    return this._element;
  }

  /**
   * Check if element was built (built whole DOM structure).
   *
   * @returns {Boolean}
   */
  isBuilt() {
    return this.buildState === STATE_BUILT;
  }

  /**
   * Parse properties within options object.
   *
   * @param {Object} options List of element options.
   */
  parseProperties(options) {
    const parsedOptions = clone(options);

    objectEach(parsedOptions, (value, key) => {
      if (isObject(value)) {
        parsedOptions[key] = this.parseProperties(value);

      } else if (isFunction(value)) {
        parsedOptions[key] = this.hot.getTranslatedPhrase(value());
      }
    });

    return parsedOptions;
  }

  /**
   * Set DOM element properties.
   *
   * @param element
   */
  setElementProperties(element) {
    const parsedOptions = this.parseProperties(this.options);

    objectEach(parsedOptions, (value, key) => {
      if (element[key] !== void 0 && key !== 'className' && key !== 'tagName' && key !== 'children') {
        element[key] = value;
      }
    });
  }

  /**
   * Build DOM structure.
   */
  build() {
    const registerEvent = (element, eventName) => {
      this.eventManager.addEventListener(element, eventName, (event) => this.runLocalHooks(eventName, event, this));
    };

    if (!this.buildState) {
      this.buildState = STATE_BUILDING;
    }
    if (this.options.className) {
      addClass(this._element, this.options.className);
    }
    if (this.options.children.length) {
      arrayEach(this.options.children, (element) => this._element.appendChild(element.element));

    } else if (this.options.wrapIt) {
      const element = document.createElement(this.options.tagName);

      this.setElementProperties(element);

      this._element.appendChild(element);

      arrayEach(EVENTS_TO_REGISTER, (eventName) => registerEvent(element, eventName));

    } else {
      arrayEach(EVENTS_TO_REGISTER, (eventName) => registerEvent(this._element, eventName));
    }

    this.hot.addHook('afterLanguageChange', () => this.onAfterLanguageChange());
  }

  onAfterLanguageChange() {
    this.update();
  }

  /**
   * Update DOM structure.
   */
  update() {
    this.setElementProperties(this._element.firstChild);
  }

  /**
   * Reset to initial state.
   */
  reset() {
    this.options.value = '';
    this.update();
  }

  /**
   * Show element.
   */
  show() {
    this.element.style.display = '';
  }

  /**
   * Hide element.
   */
  hide() {
    this.element.style.display = 'none';
  }

  /**
   * Focus element.
   */
  focus() {

  }

  destroy() {
    this.eventManager.destroy();

    this.hot.removeHook('afterLanguageChange', this.onAfterLanguageChange);

    this.eventManager = null;
    this.hot = null;

    if (this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
  }
}

mixin(BaseUI, localHooks);

export default BaseUI;
