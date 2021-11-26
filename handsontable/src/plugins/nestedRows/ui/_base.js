/**
 * Base class for the Nested Rows' UI sub-classes.
 *
 * @private
 * @class
 */
class BaseUI {
  constructor(pluginInstance, hotInstance) {
    /**
     * Instance of Handsontable.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * Reference to the main plugin instance.
     */
    this.plugin = pluginInstance;
  }
}

export default BaseUI;
