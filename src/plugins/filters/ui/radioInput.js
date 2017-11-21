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
      type: 'radio',
      tagName: 'input',
      className: 'htUIRadio',
      label: {}
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
    let priv = privatePool.get(this);
    priv.input = this._element.firstChild;

    let label = document.createElement('label');
    const parsedOptions = this.parseProperties(this.options);

    label.textContent = parsedOptions.label.textContent;
    label.htmlFor = parsedOptions.label.htmlFor;
    priv.label = label;

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

    const parsedOptions = this.parseProperties(this.options);

    privatePool.get(this).input.checked = parsedOptions.checked;
    privatePool.get(this).label.textContent = parsedOptions.label.textContent;
  }

  /**
   * Check if radio button is checked.
   *
   * @returns {Boolean}
   */
  isChecked() {
    return this.options.checked;
  }

  /**
   * Set input checked attribute
   *
   * @param value {Boolean} value
   */
  setChecked(value = true) {
    this.options.checked = value;
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
