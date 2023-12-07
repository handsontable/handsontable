import { clone, extend } from '../../../helpers/object';
import { BaseUI } from './_base';

/**
 * @private
 * @class RadioInputUI
 */
export class RadioInputUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      type: 'radio',
      tagName: 'input',
      className: 'htUIRadio',
      label: {}
    });
  }

  /**
   * The reference to the input element.
   *
   * @type {HTMLInputElement}
   */
  #input;
  /**
   * The reference to the label element.
   *
   * @type {HTMLLabelElement}
   */
  #label;

  constructor(hotInstance, options) {
    super(hotInstance, extend(RadioInputUI.DEFAULTS, options));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    const label = this.hot.rootDocument.createElement('label');

    label.textContent = this.translateIfPossible(this.options.label.textContent);
    label.htmlFor = this.translateIfPossible(this.options.label.htmlFor);
    this.#label = label;
    this.#input = this._element.firstChild;
    this.#input.checked = this.options.checked;

    this._element.appendChild(label);

    this.update();
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    this.#label.textContent = this.translateIfPossible(this.options.label.textContent);
  }

  /**
   * Check if radio button is checked.
   *
   * @returns {boolean}
   */
  isChecked() {
    return this.isBuilt() ? this.#input.checked : false;
  }

  /**
   * Set input checked attribute.
   *
   * @param {boolean} value Set the component state.
   */
  setChecked(value = true) {
    if (this.isBuilt()) {
      this.#input.checked = value;
    }
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#input.focus();
    }
  }
}
