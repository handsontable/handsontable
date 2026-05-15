import type { HotInstance } from '../../../core/types';
import { clone, extend } from '../../../helpers/object';
import { BaseUI, BaseUIOptions } from './_base';

/**
 * @private
 * @class LinkUI
 */
export class LinkUI extends BaseUI {
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
  #link: HTMLAnchorElement;

  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(LinkUI.DEFAULTS, options) as BaseUIOptions);
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    this.#link = this._element.firstChild as HTMLAnchorElement;
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    const text = (this.options as Record<string, unknown>).textContent as string;

    this.#link.textContent = String(this.translateIfPossible(text));
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#link.focus();
    }
  }

  /**
   * Activate the element.
   */
  activate() {
    this.#link.click();
  }
}
