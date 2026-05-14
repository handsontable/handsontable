import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';

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
  declare hot: HotInstance;
  /**
   * Reference to the main plugin instance.
   */
  declare plugin: NestedRows;

  constructor(pluginInstance: NestedRows, hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.plugin = pluginInstance;
  }
}

export default BaseUI;
