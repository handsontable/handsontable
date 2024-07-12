import { clone, extend, mixin, objectEach } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import EventManager from '../../../eventManager';
import { addClass } from '../../../helpers/dom/element';
import { arrayEach } from '../../../helpers/array';
import * as C from '../../../i18n/constants';

const STATE_BUILT = 'built';
const STATE_BUILDING = 'building';
const EVENTS_TO_REGISTER = ['click', 'input', 'keydown', 'keypress', 'keyup', 'focus', 'blur', 'change'];

/**
 * @private
 */
export class BaseUI {
  static get DEFAULTS() {
    return clone({
      className: '',
      value: '',
      tagName: 'div',
      children: [],
      wrapIt: true,
    });
  }

  /**
   * Instance of Handsontable.
   *
   * @type {Core}
   */
  hot;
  /**
   * Instance of EventManager.
   *
   * @type {EventManager}
   */
  eventManager = new EventManager(this);
  /**
   * List of element options.
   *
   * @type {object}
   */
  options;
  /**
   * Build root DOM element.
   *
   * @type {Element}
   * @private
   */
  _element;
  /**
   * Flag which determines build state of element.
   *
   * @type {string}
   */
  buildState;

  constructor(hotInstance, options) {
    this.hot = hotInstance;
    this.options = extend(BaseUI.DEFAULTS, options);
    this._element = this.hot.rootDocument.createElement(this.options.wrapIt ? 'div' : this.options.tagName);
  }

  /**
   * Set the element value.
   *
   * @param {*} value Set the component value.
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
   * @returns {boolean}
   */
  isBuilt() {
    return this.buildState === STATE_BUILT;
  }

  /**
   * Translate value if it is possible. It's checked if value belongs to namespace of translated phrases.
   *
   * @param {*} value Value which will may be translated.
   * @returns {*} Translated value if translation was possible, original value otherwise.
   */
  translateIfPossible(value) {
    if (typeof value === 'string' && value.startsWith(C.FILTERS_NAMESPACE)) {
      return this.hot.getTranslatedPhrase(value);
    }

    return value;
  }

  /**
   * Build DOM structure.
   */
  build() {
    const registerEvent = (element, eventName) => {
      this.eventManager
        .addEventListener(element, eventName, event => this.runLocalHooks(eventName, event, this));
    };

    if (!this.buildState) {
      this.buildState = STATE_BUILDING;
    }

    // prevents "hot.unlisten()" call when clicked
    // (https://github.com/handsontable/handsontable/blob/master/handsontable/src/tableView.js#L317-L321)
    this._element.setAttribute('data-hot-input', true);

    if (this.options.tabIndex !== undefined) {
      this._element.setAttribute('tabindex', this.options.tabIndex);
    }
    if (this.options.role !== undefined) {
      this._element.setAttribute('role', this.options.role);
    }
    if (this.options.className) {
      addClass(this._element, this.options.className);
    }

    if (this.options.children.length) {
      arrayEach(this.options.children, element => this._element.appendChild(element.element));

    } else if (this.options.wrapIt) {
      const element = this.hot.rootDocument.createElement(this.options.tagName);

      // prevents "hot.unlisten()" call when clicked
      // (https://github.com/handsontable/handsontable/blob/master/handsontable/src/tableView.js#L317-L321)
      element.setAttribute('data-hot-input', true);

      objectEach(this.options, (value, key) => {
        if (element[key] !== undefined && key !== 'className' && key !== 'tagName' && key !== 'children') {
          element[key] = this.translateIfPossible(value);
        }
      });

      this._element.appendChild(element);

      arrayEach(EVENTS_TO_REGISTER, eventName => registerEvent(element, eventName));

    } else {
      arrayEach(EVENTS_TO_REGISTER, eventName => registerEvent(this._element, eventName));
    }
  }

  /**
   * Update DOM structure.
   */
  update() {

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
    this.eventManager = null;
    this.hot = null;

    if (this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
  }
}

mixin(BaseUI, localHooks);
