import type { HotInstance } from '../../../core/types';
import { clone, extend } from '../../../helpers/object';
import type { BaseUIOptions } from './_base';
import { BaseUI } from './_base';
import { createIcon, syncIcon } from '../../../themes/engine/icons';

const DOT_ICON_CLASS_NAME = 'htUIRadioIcon';

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

    // The dot is a real element, not the input's own `::after` - an `<input>` can hold no
    // children, so it is inserted as the input's next sibling instead. `.ht-icon` carries
    // `pointer-events: none`, so a click still reaches the input underneath it.
    // Carries the slot class so `refreshIcons()` finds THIS element and re-applies the mapping in
    // place - `syncIcon()`'s own create path would append a second dot at the end of the wrapper.
    this.#input.insertAdjacentElement('afterend', createIcon(this.hot, 'radio', { className: DOT_ICON_CLASS_NAME }));

    this._element.appendChild(label);

    this.update();
  }

  /**
   * Re-applies the theme's current icon mapping to the dot. The input is built once and reused for
   * the life of the plugin, so this is what lets a runtime `icons` remap reach it (called on every
   * menu show). A no-op unless the theme's icons revision moved.
   */
  refreshIcons() {
    if (this.hot && this._element) {
      syncIcon(this.hot, this._element, DOT_ICON_CLASS_NAME, 'radio');
    }
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
