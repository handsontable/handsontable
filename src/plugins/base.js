
import {defineGetter} from './../helpers.js';

class BasePlugin {
  /**
   * @param {Object} hotInstance Handsontable instance
   * @param {Object} hotParentInstance Handsontable parent instance if exists
   */
  constructor(hotInstance, hotParentInstance) {
    defineGetter(this, 'hot', hotInstance);

    this.metadata = {};
    this.metadata.name = this.name;
  }

  /**
   * Destroy plugin
   */
  destroy() {
    delete this.hot;
  }
}

export default BasePlugin;
