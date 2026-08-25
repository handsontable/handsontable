import { BasePlugin } from '../base';
import GhostTable from '../../utils/ghostTable';
import SamplesGenerator from '../../utils/samplesGenerator';
import { warn } from '../../helpers/console';
import { isPercentValue } from '../../helpers/string';
import { valueAccordingPercent } from '../../helpers/number';

export const PLUGIN_KEY = 'autoRowHeaderWidth';
export const PLUGIN_PRIORITY = 45;

/**
 * The `rowHeaderWidth` value that turns the measurement on.
 */
export const AUTO_KEYWORD = 'auto';

/**
 * Settings accepted by the plugin.
 */
export interface AutoRowHeaderWidthSettings {
  /**
   * The number of samples of the same label length used in the measurement.
   */
  samplingRatio?: number;
  /**
   * Whether two rows carrying the same label are both measured.
   */
  allowSampleDuplicates?: boolean;
  /**
   * How many rows are read while looking for the longest label. A number, or a percentage of the
   * row count as a string.
   */
  scanLimit?: number | string;
}

/**
 * The plugin's settings with every default resolved.
 */
type AutoRowHeaderWidthDefaults = {
  samplingRatio: number | null;
  allowSampleDuplicates: boolean;
  scanLimit: number | string | null;
};

/**
 * @plugin AutoRowHeaderWidth
 * @class AutoRowHeaderWidth
 *
 * @description
 * The `AutoRowHeaderWidth` plugin sizes the row header column to its widest label.
 *
 * It completes a set. {@link AutoColumnSize} sizes a data column to its widest cell, and
 * {@link AutoRowSize} sizes a row to its tallest cell *and* the column header to its tallest
 * label. The row header's width was the one dimension nothing measured - which is why a long
 * column header makes its column grow while a long row header is simply clipped.
 *
 * The plugin is off unless you ask for it, by setting the
 * [`rowHeaderWidth`](@/api/options.md#rowheaderwidth) option to `'auto'`. It measures a single row
 * header, so a grid rendering more than one row header level keeps its default widths and is told
 * why in the console. It is deliberately not on
 * by default: it reads every row header to find the longest label, so its cost grows with the row
 * count, and switching it on for everyone would change the width of every grid that uses custom row
 * labels.
 *
 * @example
 * ```js
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   rowHeaders: ['Revenue', 'Cost of goods sold', 'Gross profit'],
 *   // size the row header column to the longest label
 *   rowHeaderWidth: 'auto',
 * });
 * ```
 */
export class AutoRowHeaderWidth extends BasePlugin {
  /**
   * The plugin's setting key.
   *
   * @returns {string}
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * The plugin's initialization priority.
   *
   * @returns {number}
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.
   *
   * It has to be `true` rather than a key list: what switches this plugin on is the `rowHeaderWidth`
   * option, not its own key, so a change it must react to can arrive under a name it does not own.
   */
  static get SETTING_KEYS(): string[] | boolean {
    return true;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   *
   * `null` means "leave it to the sampler", matching how the sibling auto-size plugins express the
   * same idea. Only settings this plugin actually reads are declared here.
   */
  static get DEFAULT_SETTINGS(): AutoRowHeaderWidthDefaults {
    return {
      samplingRatio: null,
      allowSampleDuplicates: false,
      scanLimit: null,
    };
  }

  /**
   * Instance of {@link GhostTable} used to measure the row headers off-screen.
   *
   * @type {GhostTable}
   */
  ghostTable = new GhostTable(this.hot);
  /**
   * Instance of {@link SamplesGenerator} used to reduce the row headers down to the few labels
   * worth rendering. It buckets them by label length and keeps a handful per bucket, so the DOM
   * work stays flat however many rows there are.
   *
   * @type {SamplesGenerator}
   */
  samplesGenerator = new SamplesGenerator((row: number) => ({
    value: this.hot.getRowHeader(row),
  }));
  /**
   * The last measured width, or `null` when a measurement is due.
   *
   * @type {number|null}
   */
  #cachedWidth: number | null = null;
  /**
   * The row count the cached width was measured against. A different count means the set of labels
   * may have changed, so the cache no longer holds.
   *
   * @type {number}
   */
  #cachedRowCount = -1;
  /**
   * Whether the grid has already been told that `'auto'` does nothing here.
   *
   * @type {boolean}
   */
  #warnedAboutHeaderLevels = false;

  /**
   * Checks if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] !== false && this.#hasAutoKeyword();
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.samplesGenerator.setAllowDuplicates(this.getSetting<boolean>('allowSampleDuplicates'));

    const samplingRatio = this.getSetting<number | null>('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(parseInt(String(samplingRatio), 10));
    }

    this.addHook('modifyRowHeaderWidth', this.#onModifyRowHeaderWidth);
    this.addHook('afterLoadData', this.#onInvalidate);
    this.addHook('afterUpdateData', this.#onInvalidate);
    this.addHook('afterCreateRow', this.#onInvalidate);
    this.addHook('afterRemoveRow', this.#onInvalidate);
    this.addHook('afterSetDataAtCell', this.#onInvalidate);
    this.addHook('afterColumnSort', this.#onInvalidate);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   */
  updatePlugin(): void {
    this.clearCache();
    this.resetWarnings();
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    super.disablePlugin();

    this.clearCache();
  }

  /**
   * Returns the width the row header column needs in order to show its longest label in full.
   *
   * The value is cached, so calling this repeatedly costs nothing until the data or the settings
   * change.
   *
   * @returns {number} The measured width in pixels, or `0` when there is nothing to measure.
   */
  getRowHeaderWidth(): number {
    if (this.#cachedWidth === null || this.#cachedRowCount !== this.hot.countRows()) {
      this.#cachedWidth = this.#measure();
      this.#cachedRowCount = this.hot.countRows();
    }

    return this.#cachedWidth;
  }

  /**
   * Throws the measured width away, so the next read measures again.
   */
  clearCache(): void {
    this.#cachedWidth = null;
    this.#cachedRowCount = -1;
  }

  /**
   * Allows the header-level warning to be shown again, after the grid is reconfigured.
   */
  resetWarnings(): void {
    this.#warnedAboutHeaderLevels = false;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.ghostTable.clean();

    super.destroy();
  }

  /**
   * Checks whether the user asked for the measurement through the `rowHeaderWidth` option.
   *
   * Only the plain `'auto'` value counts. The array form of `rowHeaderWidth` addresses one row
   * header level per entry, and both places that run the `modifyRowHeaderWidth` hook feed it a
   * different shape - `Viewport#getRowHeaderWidth` passes the levels already summed into a single
   * number, while `ColumnUtils#calculateWidths` passes the array itself. A per-level measurement
   * would have to answer both with the shape each expects, and measuring a level above the first
   * needs its renderer, which no public API hands out. Until that is settled, an array keeps its
   * current meaning and every entry stays a number.
   *
   * @returns {boolean}
   */
  #hasAutoKeyword(): boolean {
    return this.hot.getSettings().rowHeaderWidth === AUTO_KEYWORD;
  }

  /**
   * Returns how many rows are read while looking for the longest label.
   *
   * @param {number} totalRows The number of rows in the grid.
   * @returns {number}
   */
  #getScannedRowCount(totalRows: number): number {
    const scanLimit = this.getSetting<number | string | null>('scanLimit');

    if (scanLimit === undefined || scanLimit === null) {
      return totalRows;
    }

    const limit = isPercentValue(String(scanLimit))
      ? valueAccordingPercent(totalRows, String(scanLimit))
      : parseInt(String(scanLimit), 10);

    return Number.isNaN(limit) ? totalRows : Math.min(totalRows, limit);
  }

  /**
   * Renders the sampled row headers off-screen and returns the width of the widest one.
   *
   * @returns {number} The measured width in pixels.
   */
  #measure(): number {
    const scannedRows = this.#getScannedRowCount(this.hot.countRows());

    if (scannedRows < 1) {
      return 0;
    }

    // The row header sits at column -1, so the samples are generated for that column across the
    // scanned rows. Only the label lengths matter here - the label itself is re-rendered by the
    // grid's own row header renderers when the ghost table measures it.
    const samplesByColumn = this.samplesGenerator
      .generateColumnSamples(-1, { from: 0, to: scannedRows - 1 });
    // `generateColumnSamples` keys its result by column index; the per-label-length samples are the
    // value inside. AutoColumnSize unwraps the same way before handing them to the ghost table.
    const samples = samplesByColumn.get(-1) as Map<string | number, never> | undefined;

    if (!samples || samples.size === 0) {
      return 0;
    }

    let width = 0;

    try {
      // The ghost table takes the map over, and its `clean()` clears whatever it was handed - so it
      // gets a copy, never the generator's own map.
      this.ghostTable.addRowHeadersColumn(new Map(samples));
      this.ghostTable.getWidths((_column: number, measuredWidth: number) => {
        width = Math.max(width, measuredWidth);
      });
    } finally {
      // A throwing row header renderer must not leave the measurement table attached to the DOM.
      this.ghostTable.clean();
    }

    return width;
  }

  /**
   * Replaces the `'auto'` keyword with the measured width.
   *
   * The hook runs on every draw, so everything it does beyond reading the cache has to stay out of
   * this path.
   *
   * The width Walkontable resolved on its own acts as the lower bound, so `'auto'` only ever widens
   * the header. That keeps the default width a floor: a grid whose labels are all short keeps the
   * header it has today instead of collapsing around a one-character label.
   *
   * @param {number} rowHeaderWidth The width Walkontable resolved on its own.
   * @returns {number} The width to use.
   */
  #onModifyRowHeaderWidth = (rowHeaderWidth: number) => {
    if (this.hot.countRowHeaders() > 1) {
      this.#warnAboutHeaderLevels();

      return rowHeaderWidth;
    }

    const resolvedWidth = typeof rowHeaderWidth === 'number' ? rowHeaderWidth : 0;

    return Math.max(this.getRowHeaderWidth(), resolvedWidth);
  };

  /**
   * Says once why `'auto'` is doing nothing, so the grid does not just silently keep its old width.
   */
  #warnAboutHeaderLevels() {
    if (this.#warnedAboutHeaderLevels) {
      return;
    }

    this.#warnedAboutHeaderLevels = true;

    warn('The `rowHeaderWidth: \'auto\'` setting measures a single row header, and this grid ' +
      'renders more than one. The row headers keep their default width. Give each level its own ' +
      'width instead, for example `rowHeaderWidth: [80, 40]`.');
  }

  /**
   * Drops the cached width after a change that can alter the row header labels.
   */
  #onInvalidate = () => {
    this.clearCache();
  };
}
