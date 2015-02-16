
import {defineGetter} from './../helpers.js';

class BasePlugin {
  /**
   * @param {Object} hotInstance Handsontable instance
   * @param {Object} hotParentInstance Handsontable parent instance if exists
   */
  constructor(hotInstance, hotParentInstance) {
    defineGetter(this, 'hot', hotInstance);
  }

  /**
   * Destroy plugin
   */
  destroy() {
    delete this.hot;
  }
}

export default BasePlugin;
