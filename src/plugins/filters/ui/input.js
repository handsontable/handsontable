import { addClass } from '../../../helpers/dom/element';
import { clone, extend } from '../../../helpers/object';
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
    this.addLocalHook('click', () => this.onClick());
    this.addLocalHook('keyup', event => this.onKeyup(event));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    const priv = privatePool.get(this);
    const icon = this.hot.rootDocument.createElement('div');

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

    const input = privatePool.get(this).input;

    input.type = this.options.type;
    input.placeholder = this.translateIfPossible(this.options.placeholder);
    input.value = this.translateIfPossible(this.options.value);
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
   */
  onClick() {

  }

  /**
   * OnKeyup listener.
   *
   * @param {Event} event The mouse event object.
   */
  onKeyup(event) {
    this.options.value = event.target.value;
  }
}

export default InputUI;
