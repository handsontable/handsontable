import {clone, extend} from 'handsontable/helpers/object';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * @class RadioInputUI
 * @util
 */
class RadioInputUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      className: 'htUIRadio',
      label: {},
      input: {},
      wrapIt: false
    });
  }

  constructor(hotInstance, options) {
    super(hotInstance, extend(RadioInputUI.DEFAULTS, options));

    privatePool.set(this, {});
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    const input = document.createElement('input');
    const label = document.createElement('label');
    const priv = privatePool.get(this);

    priv.input = input;
    priv.label = label;

    this.setElementProperties(input, this.options.input);
    this.setElementProperties(label, this.options.label);

    this._element.appendChild(input);
    this._element.appendChild(label);
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    this.setElementProperties(privatePool.get(this).input, this.options.input);
    this.setElementProperties(privatePool.get(this).label, this.options.label);
  }

  /**
   * Get the inpput element value.
   *
   * @returns {*}
   */
  getValue() {
    return this.options.input.value;
  }

  /**
   * Check if radio button is checked.
   *
   * @returns {Boolean}
   */
  isChecked() {
    return this.options.input.checked;
  }

  /**
   * Set input checked attribute
   *
   * @param value {Boolean} value
   */
  setChecked(value = true) {
    this.options.input.checked = value;
    this.update();
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      privatePool.get(this).input.focus();
    }
  }

}

export default RadioInputUI;
