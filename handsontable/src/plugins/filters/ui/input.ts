import type { HotInstance } from '../../../common';
import { addClass } from '../../../helpers/dom/element';
import { clone, extend } from '../../../helpers/object';
import { BaseUI, BaseUIOptions } from './_base';

/**
 * @private
 * @class InputUI
 */
export class InputUI extends BaseUI {
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      placeholder: '',
      type: 'text',
      tagName: 'input',
      tabIndex: -1,
    }) as BaseUIOptions;
  }

  /**
   * The reference to the input element.
   *
   * @type {HTMLInputElement}
   */
  #input: HTMLInputElement;

  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(InputUI.DEFAULTS, options) as Record<string, unknown>);
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.addLocalHook('keyup', (event: Event) => this.#onKeyup(event));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    const icon = this.hot.rootDocument.createElement('div');

    this.#input = this._element.firstChild as HTMLInputElement;

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

    this.#input.type = this.options.type as string;
    this.#input.placeholder = this.translateIfPossible(this.options.placeholder) as string;
    this.#input.value = this.translateIfPossible(this.options.value) as string;
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
  #onKeyup(event: Event) {
    this.options.value = (event.target as HTMLInputElement).value;
  }
}
