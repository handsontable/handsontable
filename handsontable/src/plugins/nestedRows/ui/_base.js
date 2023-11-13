/**
 * Base class for the Nested Rows' UI sub-classes.
 *
 * @private
 * @class
 */
class BaseUI {
  /**
   * Instance of Handsontable.
   *
   * @type {Core}
   */
  hot;
  /**
   * Reference to the main plugin instance.
   */
  plugin;

  constructor(pluginInstance, hotInstance) {
    this.hot = hotInstance;
    this.plugin = pluginInstance;
  }
}

export default BaseUI;
