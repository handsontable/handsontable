import type { HotInstance } from '../../../core/types';
import { clone, extend } from '../../../helpers/object';
import type { BaseUIOptions } from './_base';
import { BaseUI } from './_base';

/**
 * @private
 * @class LinkUI
 */
export class LinkUI extends BaseUI {
  /**
   * Returns the default configuration options for the link UI component, including href, tag name, and tab index.
   */
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      href: '#',
      tagName: 'a',
      tabIndex: -1,
      role: 'button',
    }) as BaseUIOptions;
  }

  /**
   * The reference to the link element.
   *
   * @type {HTMLLinkElement}
   */
  #link: HTMLAnchorElement | null = null;

  /**
   * Initializes the link UI component with the Handsontable instance and merged configuration options.
   */
  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(LinkUI.DEFAULTS, options) as BaseUIOptions);
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    if (this._element) {
      this.#link = this._element.firstChild as HTMLAnchorElement;
    }
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    const text = (this.options as Record<string, unknown>).textContent as string;

    if (this.#link) {
      this.#link.textContent = String(this.translateIfPossible(text));
    }
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt() && this.#link) {
      this.#link.focus();
    }
  }

  /**
   * Activate the element.
   */
  activate() {
    this.#link?.click();
  }
}
