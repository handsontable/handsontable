import { randomString } from '../../../../helpers/string';
import { setCurrentWindowContext } from '../borderRenderer/svg/color';

/**
 * @class Core
 */
class Core {
  /**
   * @param {Object} settings
   */
  constructor(settings) {
    // this is the namespace for global events
    this.guid = `wt_${randomString()}`;
    this.rootDocument = settings.table.ownerDocument;
    this.rootWindow = this.rootDocument.defaultView;
    setCurrentWindowContext(this.rootWindow);
  }

  /**
   * Get/Set Walkontable instance setting
   *
   * @param {String} key
   * @param {*} [param1]
   * @param {*} [param2]
   * @param {*} [param3]
   * @param {*} [param4]
   * @returns {*}
   */
  getSetting(key, param1, param2, param3, param4) {
    // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    return this.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  /**
   * Checks if setting exists
   *
   * @param {String} key
   * @returns {Boolean}
   */
  hasSetting(key) {
    return this.wtSettings.has(key);
  }
}

export default Core;
