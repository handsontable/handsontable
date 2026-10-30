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
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   bindRowsWithHeaders: true,
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings" />
 * ```
 * :::
 */
export class BindRowsWithHeaders extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Plugin indexes cache.
   *
   * @private
   * @type {null|IndexMap}
   */
  headerIndexes: Record<string, unknown> | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link BindRowsWithHeaders#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    const selfWithGetSetting = this as unknown as { getSetting: () => string };
    const MapStrategy =
      bindTypeToMapStrategy.get(selfWithGetSetting.getSetting()) ?? bindTypeToMapStrategy.get(DEFAULT_BIND);

    if (!MapStrategy) {
      return;
    }

    this.headerIndexes = this.hot.rowIndexMapper.registerMap(
      'bindRowsWithHeaders', new MapStrategy()
    ) as unknown as Record<string, unknown>;

    this.addHook('modifyRowHeader', this.#onModifyRowHeader);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    this.hot.rowIndexMapper.unregisterMap('bindRowsWithHeaders');

    super.disablePlugin();
  }

  /**
   * Returns the header number of every physical row while the strict strategy keeps them, or `null`.
   * The loose strategy's numbers always equal the physical indexes, so there is nothing to keep. A data load
   * re-initializes the map to the identity order, so a caller that loads other data and comes back (a
   * SheetsBar switch) keeps them through {@link BindRowsWithHeaders#_exportStrictHeaders} and
   * {@link BindRowsWithHeaders#_importStrictHeaders}.
   *
   * @private
   * @returns {number[]|null}
   */
  _exportStrictHeaders(): number[] | null {
    if (!(this.headerIndexes instanceof StrictBindsMap)) {
      return null;
    }

    return (this.headerIndexes.getValues() as number[]).slice();
  }

  /**
   * Puts back the header numbers {@link BindRowsWithHeaders#_exportStrictHeaders} returned, one per physical
   * row. Nothing is written while the strategy is not strict, or when the numbers do not cover every row the
   * map holds (the data gained or lost rows since they were exported). Returns whether they were written.
   *
   * @private
   * @param {number[]} headers The header number of every physical row.
   * @returns {boolean}
   */
  _importStrictHeaders(headers: number[]): boolean {
    if (!(this.headerIndexes instanceof StrictBindsMap) || headers.length !== this.headerIndexes.getLength()) {
      return false;
    }

    this.headerIndexes.setValues(headers.slice());

    return true;
  }

  /**
   * On modify row header listener.
   *
   * @param {number} row Row index.
   * @returns {number}
   */
  #onModifyRowHeader = (row: number) => {
    return (this.headerIndexes as { getValueAtIndex: (index: number) => number })
      .getValueAtIndex(this.hot.toPhysicalRow(row));
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    super.destroy();
  }
}
