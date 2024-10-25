import { BasePlugin } from '../base';
import { StretchCalculator } from './calculator';

export const PLUGIN_KEY = 'stretchColumns';
export const PLUGIN_PRIORITY = 155;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin StretchColumns
 * @class StretchColumns
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
export class StretchColumns extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return true;
  }

  /**
   * The stretch calculator.
   *
   * @type {StretchCalculator}
   */
  #stretchCalculator = new StretchCalculator(this.hot);
  /**
   * The previous width of the root element. Helps to determine if the width has changed.
   *
   * @type {number | null}
   */
  #previousTableWidth = null;
  /**
   * It observes the root element to detect changes in its width, and if detected, then it triggers
   * the table dimension calculations. In a situation where the browser's vertical scrollbar
   * appears - caused by some external UI element, the observer triggers the render.
   *
   * @type {ResizeObserver}
   */
  #resizeObserver = new ResizeObserver((entries) => {
    requestAnimationFrame(() => {
      if (!this.hot?.view.isHorizontallyScrollableByWindow()) {
        return;
      }

      entries.forEach(({ contentRect }) => {
        if (this.#previousTableWidth !== null && this.#previousTableWidth !== contentRect.width) {
          this.hot.refreshDimensions();
          this.hot.view.adjustElementsSize();
        }

        this.#previousTableWidth = contentRect.width;
      });
    });
  });

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

    this.#stretchCalculator.useStrategy(this.hot.getSettings().stretchH);
    this.#resizeObserver.observe(this.hot.rootElement);

    this.addHook('beforeRender', (...args) => this.#onBeforeRender(...args));
    this.addHook('modifyColWidth', (...args) => this.#onModifyColWidth(...args), 10);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.#stretchCalculator.useStrategy(this.hot.getSettings().stretchH);
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
    this.#resizeObserver.unobserve(this.hot.rootElement);
  }

  /**
   * Gets the calculated column width based on the stretching
   * strategy defined by {@link Options#stretchH} option.
   *
   * @param {number} columnVisualIndex The visual index of the column.
   * @returns {number | null}
   */
  getColumnWidth(columnVisualIndex) {
    return this.#stretchCalculator.getStretchedWidth(columnVisualIndex);
  }

  /**
   * Hook that modifies the column width - applies by the stretching logic.
   *
   * @param {number} width The column width.
   * @param {number} column The visual column index.
   * @param {string} source The source of the modification.
   * @returns {number}
   */
  #onModifyColWidth(width, column, source) {
    if (source === this.pluginName) {
      return;
    }

    const newWidth = this.getColumnWidth(column);

    if (typeof newWidth === 'number') {
      return newWidth;
    }

    return width;
  }

  /**
   * On each before render the plugin recalculates the column widths
   * based on the chosen stretching strategy.
   *
   * @param {boolean} fullRender If `true` then the full render is in progress.
   */
  #onBeforeRender(fullRender) {
    if (fullRender) {
      this.#stretchCalculator.refreshStretching();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#resizeObserver.disconnect();
    this.#resizeObserver = null;
    this.#stretchCalculator = null;
    super.destroy();
  }
}
