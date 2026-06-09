import type { HotInstance } from '../../../core/types';
import { clone, extend, mixin, objectEach } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import EventManager from '../../../eventManager';
import { addClass } from '../../../helpers/dom/element';
import { arrayEach } from '../../../helpers/array';
import * as C from '../../../i18n/constants';

const STATE_BUILT = 'built';
const STATE_BUILDING = 'building';
const EVENTS_TO_REGISTER = ['click', 'input', 'keydown', 'keypress', 'keyup', 'focus', 'blur', 'change'];

export interface BaseUIOptions {
  className?: string;
  value?: unknown;
  tagName?: string;
  // eslint-disable-next-line no-use-before-define
  children?: BaseUI[];
  wrapIt?: boolean;
  tabIndex?: number;
  role?: string;
  menuContainer?: HTMLElement;
  [key: string]: unknown;
}

/**
 * @private
 */
export class BaseUI {
  /**
   * Returns the default configuration options applied to a new UI component instance.
   */
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      className: '',
      value: '',
      tagName: 'div',
      children: [],
      wrapIt: true,
    }) as BaseUIOptions;
  }

  /**
   * Instance of Handsontable.
   *
   * @type {Core}
   */
  declare hot: HotInstance | null;
  /**
   * Instance of EventManager.
   *
   * @type {EventManager}
   */
  eventManager: EventManager | null = new EventManager(this);
  /**
   * List of element options.
   *
   * @type {object}
   */
  declare options: BaseUIOptions;
  /**
   * Build root DOM element.
   *
   * @type {Element}
   * @private
   */
  declare _element: HTMLElement | null;
  /**
   * Flag which determines build state of element.
   *
   * @type {string}
   */
  declare buildState: string | undefined;

  /**
   * Initializes the UI component with the Handsontable instance and merged configuration options.
   */
  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    this.hot = hotInstance;
    this.options = extend(BaseUI.DEFAULTS, options) as BaseUIOptions;
    this._element = hotInstance.rootDocument.createElement(
      this.options.wrapIt ? 'div' : (this.options.tagName ?? 'div'));
  }

  /**
   * Set the element value.
   *
   * @param {*} value Set the component value.
   */
  setValue(value: unknown) {
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
  translateIfPossible(value: unknown) {
    if (typeof value === 'string' && value.startsWith(C.FILTERS_NAMESPACE)) {
      return this.hot?.getTranslatedPhrase(value) ?? value;
    }

    return value;
  }

  /**
   * Build DOM structure.
   */
  build() {
    if (!this._element || !this.hot) {
      return;
    }

    const rootElement = this._element;
    const { eventManager } = this;
    const registerEvent = (element: HTMLElement, eventName: string) => {
      eventManager?.addEventListener(element, eventName, event => this.runLocalHooks(eventName, event, this));
    };

    if (!this.buildState) {
      this.buildState = STATE_BUILDING;
    }

    // prevents "hot.unlisten()" call when clicked
    // (https://github.com/handsontable/handsontable/blob/master/handsontable/src/tableView.js#L317-L321)
    rootElement.setAttribute('data-hot-input', 'true');

    if (this.options.tabIndex !== undefined) {
      rootElement.setAttribute('tabindex', String(this.options.tabIndex));
    }
    if (this.options.role !== undefined) {
      rootElement.setAttribute('role', this.options.role);
    }
    if (this.options.className) {
      addClass(rootElement, this.options.className);
    }

    if (this.options.children?.length) {
      arrayEach(this.options.children, (element) => {
        const el = (element as BaseUI).element;

        if (el) {
          rootElement.appendChild(el);
        }
      });

    } else if (this.options.wrapIt) {
      const element = this.hot.rootDocument.createElement(
        this.options.tagName ?? 'div'
      ) as HTMLElement & Record<string, unknown>;

      // prevents "hot.unlisten()" call when clicked
      // (https://github.com/handsontable/handsontable/blob/master/handsontable/src/tableView.js#L317-L321)
      element.setAttribute('data-hot-input', 'true');

      objectEach(this.options as Record<string, unknown>, (value: unknown, key: string) => {
        if (element[key] !== undefined && key !== 'className' && key !== 'tagName' && key !== 'children') {
          element[key] = this.translateIfPossible(value);
        }
      });

      rootElement.appendChild(element);

      arrayEach(EVENTS_TO_REGISTER, eventName => registerEvent(element, eventName));

    } else {
      arrayEach(EVENTS_TO_REGISTER, eventName => registerEvent(rootElement, eventName));
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
    const el = this.element;

    if (el) {
      el.style.display = '';
    }
  }

  /**
   * Hide element.
   */
  hide() {
    const el = this.element;

    if (el) {
      el.style.display = 'none';
    }
  }

  /**
   * Focus element.
   */
  focus() { // intentionally empty
  }

  /**
   * Destroys the UI component by releasing the event manager, nulling references, and removing the element from the DOM.
   */
  destroy() {
    this.eventManager?.destroy();
    this.eventManager = null;
    this.hot = null;

    if (this._element?.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
  }
}

export interface BaseUI {
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string, ...args: unknown[]): void;
  clearLocalHooks(): this;
}

mixin(BaseUI, localHooks);
