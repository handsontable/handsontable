import type { HotInstance } from '../../../common';
import { clone, extend } from '../../../helpers/object';
import { BaseUI, BaseUIOptions } from './_base';

/**
 * @private
 * @class RadioInputUI
 */
export class RadioInputUI extends BaseUI {
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      type: 'radio',
      tagName: 'input',
      className: 'htUIRadio',
      label: {}
    }) as BaseUIOptions;
  }

  /**
   * The reference to the input element.
   *
   * @type {HTMLInputElement}
   */
  #input: HTMLInputElement;
  /**
   * The reference to the label element.
   *
   * @type {HTMLLabelElement}
   */
  #label: HTMLLabelElement;

  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(RadioInputUI.DEFAULTS, options) as Record<string, unknown>);
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    const label = this.hot.rootDocument.createElement('label');
    const labelOpts = this.options.label as { textContent?: string; htmlFor?: string };

    label.textContent = this.translateIfPossible(labelOpts.textContent) as string;
    label.htmlFor = this.translateIfPossible(labelOpts.htmlFor) as string;
    this.#label = label;
    this.#input = this._element.firstChild as HTMLInputElement;
    this.#input.checked = this.options.checked as boolean;

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

    const labelOpts = this.options.label as { textContent?: string; htmlFor?: string };

    this.#label.textContent = this.translateIfPossible(labelOpts.textContent) as string;
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
