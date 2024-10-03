import { BasePlugin } from '../base';
import LooseBindsMap from './maps/looseBindsMap';
import StrictBindsMap from './maps/strictBindsMap';

export const PLUGIN_KEY = 'bindRowsWithHeaders';
export const PLUGIN_PRIORITY = 210;

const DEFAULT_BIND = 'loose';

const bindTypeToMapStrategy = new Map([
  ['loose', LooseBindsMap],
  ['strict', StrictBindsMap]
]);

/**
 * @plugin BindRowsWithHeaders
 * @class BindRowsWithHeaders
 *
 * @description
 * Plugin allows binding the table rows with their headers.
 *
 * If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if
 * at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   // enable plugin
 *   bindRowsWithHeaders: true
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   // enable plugin
 *   bindRowsWithHeaders={true}
 * />
 * ```
 * :::
 */
export class BindRowsWithHeaders extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Plugin indexes cache.
   *
   * @private
   * @type {null|IndexMap}
   */
  headerIndexes = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link BindRowsWithHeaders#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const MapStrategy = bindTypeToMapStrategy.get(this.getSetting()) ?? bindTypeToMapStrategy.get(DEFAULT_BIND);

    this.headerIndexes = this.hot.rowIndexMapper.registerMap('bindRowsWithHeaders', new MapStrategy());

    this.addHook('modifyRowHeader', row => this.#onModifyRowHeader(row));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap('bindRowsWithHeaders');

    super.disablePlugin();
  }

  /**
   * On modify row header listener.
   *
   * @param {number} row Row index.
   * @returns {number}
   */
  #onModifyRowHeader(row) {
    return this.headerIndexes.getValueAtIndex(this.hot.toPhysicalRow(row));
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
