import {addClass} from 'handsontable/helpers/dom/element';
import {clone, extend} from 'handsontable/helpers/object';
import * as C from 'handsontable/i18n/constants';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * @class InputUI
 * @util
 */
class InputUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      placeholder: '',
      type: 'text',
      tagName: 'input',
    });
  }

  constructor(hotInstance, options) {
    super(hotInstance, extend(InputUI.DEFAULTS, options));

    privatePool.set(this, {});
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.addLocalHook('click', (event) => this.onClick(event));
    this.addLocalHook('keyup', (event) => this.onKeyup(event));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    let priv = privatePool.get(this);
    let icon = document.createElement('div');

    priv.input = this._element.firstChild;

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

    let input = privatePool.get(this).input;

    input.type = this.options.type;
    input.placeholder = this.hot.getTranslatedPhrase(this.options.placeholder);

    if (typeof this.options.value === 'string' && this.options.value.startsWith(C.FILTERS_NAMESPACE)) {
      input.value = this.hot.getTranslatedPhrase(this.options.value);

    } else {
      input.value = this.options.value;
    }
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      privatePool.get(this).input.focus();
    }
  }

  /**
   * OnClick listener.
   *
   * @param {Event} event
   */
  onClick(event) {

  }

  /**
   * OnKeyup listener.
   *
   * @param {Event} event
   */
  onKeyup(event) {
    this.options.value = event.target.value;
  }
}

export default InputUI;
