import { clone, extend } from '../../../helpers/object';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * @class LinkUI
 * @util
 */
class LinkUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      href: '#',
      tagName: 'a',
    });
  }

  constructor(hotInstance, options) {
    super(hotInstance, extend(LinkUI.DEFAULTS, options));

    privatePool.set(this, {});
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    const priv = privatePool.get(this);

    priv.link = this._element.firstChild;
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    privatePool.get(this).link.textContent = this.translateIfPossible(this.options.textContent);
  }
}

export default LinkUI;
