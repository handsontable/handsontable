import { randomString } from '../../../../helpers/string';
import { setCurrentWindowContext } from '../borderRenderer/svg/color';

/**
 * @class Core
 */
class Core {
  /**
   * @param {object} settings The Walkontable settings.
   */
  constructor(settings) {
    // this is the namespace for global events
    this.guid = `wt_${randomString()}`;
    this.rootDocument = settings.table.ownerDocument;
    this.rootWindow = this.rootDocument.defaultView;
    setCurrentWindowContext(this.rootWindow);
  }

  /**
   * Get/Set Walkontable instance setting.
   *
   * @param {string} key The settings key to retrieve.
   * @param {*} [param1] Additional parameter passed to the options defined as function.
   * @param {*} [param2] Additional parameter passed to the options defined as function.
   * @param {*} [param3] Additional parameter passed to the options defined as function.
   * @param {*} [param4] Additional parameter passed to the options defined as function.
   * @returns {*}
   */
  getSetting(key, param1, param2, param3, param4) {
    // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    return this.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  /**
   * Checks if setting exists.
   *
   * @param {string} key The settings key to check.
   * @returns {boolean}
   */
  hasSetting(key) {
    return this.wtSettings.has(key);
  }
}

export default Core;
