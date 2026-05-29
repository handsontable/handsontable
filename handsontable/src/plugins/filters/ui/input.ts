import type { HotInstance } from '../../../core/types';
import { addClass, eventTargetEl } from '../../../helpers/dom/element';
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
  #input: HTMLInputElement | null = null;

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

    if (!this._element || !this.hot) {
      return;
    }

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

    if (this.#input) {
      this.#input.type = String(this.options.type ?? 'text');
      this.#input.placeholder = String(this.translateIfPossible(this.options.placeholder) ?? '');
      this.#input.value = String(this.translateIfPossible(this.options.value) ?? '');
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

  /**
   * OnKeyup listener.
   *
   * @param {Event} event The mouse event object.
   */
  #onKeyup(event: Event) {
    this.options.value = eventTargetEl<HTMLInputElement>(event)!.value;
  }
}
