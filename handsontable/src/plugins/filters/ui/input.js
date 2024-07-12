import { addClass } from '../../../helpers/dom/element';
import { clone, extend } from '../../../helpers/object';
import { BaseUI } from './_base';

/**
 * @private
 * @class InputUI
 */
export class InputUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      placeholder: '',
      type: 'text',
      tagName: 'input',
      tabIndex: -1,
    });
  }

  /**
   * The reference to the input element.
   *
   * @type {HTMLInputElement}
   */
  #input;

  constructor(hotInstance, options) {
    super(hotInstance, extend(InputUI.DEFAULTS, options));
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.addLocalHook('keyup', event => this.#onKeyup(event));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    const icon = this.hot.rootDocument.createElement('div');

    this.#input = this._element.firstChild;

    addClass(this._element, 'htUIInput');
    addClass(icon, 'htUIInputIcon');

    this._element.appendChild(icon);

    this.update();
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    this.#input.type = this.options.type;
    this.#input.placeholder = this.translateIfPossible(this.options.placeholder);
    this.#input.value = this.translateIfPossible(this.options.value);
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#input.focus();
    }
  }

  /**
   * OnKeyup listener.
   *
   * @param {Event} event The mouse event object.
   */
  #onKeyup(event) {
    this.options.value = event.target.value;
  }
}
