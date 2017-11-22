import {clone, extend} from 'handsontable/helpers/object';
import BaseUI from './_base';

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
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
  }

  /**
   * Update element.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    this.setElementProperties(this._element.firstChild);

    super.update();
  }
}

export default LinkUI;
