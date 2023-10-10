import { clone, extend } from '../../../helpers/object';
import BaseUI from './_base';

/**
 * @private
 * @class LinkUI
 */
class LinkUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      href: '#',
      tagName: 'a',
      tabIndex: -1,
    });
  }

  /**
   * The reference to the link element.
   *
   * @type {HTMLLinkElement}
   */
  #link;

  constructor(hotInstance, options) {
    super(hotInstance, extend(LinkUI.DEFAULTS, options));
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    this.#link = this._element.firstChild;
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    this.#link.textContent = this.translateIfPossible(this.options.textContent);
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#link.focus();
    }
  }
}

export default LinkUI;
