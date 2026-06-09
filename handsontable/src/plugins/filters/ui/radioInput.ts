import type { HotInstance } from '../../../core/types';
import { clone, extend } from '../../../helpers/object';
import type { BaseUIOptions } from './_base';
import { BaseUI } from './_base';

/**
 * @private
 * @class RadioInputUI
 */
export class RadioInputUI extends BaseUI {
  /**
   * Returns the default configuration options for the radio input UI component, including type, tag name, and CSS class.
   */
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
  #input: HTMLInputElement | null = null;
  /**
   * The reference to the label element.
   *
   * @type {HTMLLabelElement}
   */
  #label: HTMLLabelElement | null = null;

  /**
   * Initializes the radio input UI component with the Handsontable instance and merged configuration options.
   */
  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(RadioInputUI.DEFAULTS, options) as Record<string, unknown>);
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    if (!this.hot || !this._element) {
      return;
    }

    const label = this.hot.rootDocument.createElement('label');
    const labelOpts = this.options.label as { textContent?: string; htmlFor?: string };

    label.textContent = String(this.translateIfPossible(labelOpts.textContent) ?? '');
    label.htmlFor = String(this.translateIfPossible(labelOpts.htmlFor) ?? '');
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

    if (this.#label) {
      this.#label.textContent = String(this.translateIfPossible(labelOpts.textContent) ?? '');
    }
  }

  /**
   * Check if radio button is checked.
   *
   * @returns {boolean}
   */
  isChecked() {
    return this.isBuilt() && this.#input ? this.#input.checked : false;
  }

  /**
   * Set input checked attribute.
   *
   * @param {boolean} value Set the component state.
   */
  setChecked(value = true) {
    if (this.isBuilt() && this.#input) {
      this.#input.checked = value;
    }
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#input?.focus();
    }
  }
}
