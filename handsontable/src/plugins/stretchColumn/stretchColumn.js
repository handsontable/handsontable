import { BasePlugin } from '../base';
import Hooks from '../../pluginHooks';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import { StretchCalculator } from './calculator';

export const PLUGIN_KEY = 'stretchColumn';
export const PLUGIN_PRIORITY = 155;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin StretchColumn
 * @class StretchColumn
 *
 * @description
 * This plugin allows to set column widths based on their widest cells.
 *
 * By default, the plugin is declared as `'none'`, which makes it disabled (same as if it was declared as `false`).
 *
 * The plugin determines what happens when the declared grid width is different from the calculated sum of all column widths.
 *
 * ```js
 * // fit the grid to the container, by stretching only the last column
 * stretchH: 'last',
 *
 * // fit the grid to the container, by stretching all columns evenly
 * stretchH: 'all',
 * ```
 *
 * To configure this plugin see {@link Options#stretchH}.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
 *   stretchH: 'all',
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * // First, let's construct Handsontable
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   stretchH={'all'}
 * />
 * ```
 * :::
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export class StretchColumn extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return true;
  }

  #stretchCalculator = new StretchCalculator(this.hot);

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link #enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return ['all', 'last'].includes(this.hot.getSettings().stretchH);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    // this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));
    // this.addHook('beforeChangeRender', (...args) => this.#onBeforeChange(...args));
    // this.addHook('afterFormulasValuesUpdate', (...args) => this.#onAfterFormulasValuesUpdate(...args));
    this.addHook('beforeRender', () => this.#onBeforeRender());
    this.addHook('modifyColWidth', (...args) => this.#onModifyColWidth(...args));
    // this.addHook('init', () => this.#onInit());

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Recalculate columns stretching.
   */
  refreshStretching() {
    this.#stretchCalculator.refreshStretching();
  }

  getColumnWidth(columnVisualIndex) {
    return this.#stretchCalculator.getColumnWidth(columnVisualIndex);
  }

  #onModifyColWidth(width, column) {
    const newWidth = this.getColumnWidth(column);

    if (typeof newWidth === 'number') {
      return newWidth;
    }

    return width;
  }

  /**
   * On before view render listener.
   */
  #onBeforeRender() {
    this.#stretchCalculator.refreshStretching();
  }

  /**
   * On after load data listener.
   *
   * @param {Array} sourceData Source data.
   * @param {boolean} isFirstLoad `true` if this is the first load.
   */
  #onAfterLoadData(sourceData, isFirstLoad) {

  }

  /**
   * On after Handsontable init fill plugin with all necessary values.
   */
  #onInit() {

  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
