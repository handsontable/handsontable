import { BasePlugin } from '../base';
import GhostTable from '../../utils/ghostTable';
import SamplesGenerator from '../../utils/samplesGenerator';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import { warn } from '../../helpers/console';

export const PLUGIN_KEY = 'autoRowHeaderSize';
export const PLUGIN_PRIORITY = 45;

/**
 * Settings accepted by the plugin.
 */
export interface AutoRowHeaderSizeSettings {
  /**
   * The number of samples of the same label length used in the measurement.
   */
  samplingRatio?: number;
  /**
   * Whether two rows carrying the same label are both measured.
   */
  allowSampleDuplicates?: boolean;
}

/**
 * The plugin's settings with every default resolved.
 */
type AutoRowHeaderSizeDefaults = {
  samplingRatio: number | null;
  allowSampleDuplicates: boolean;
};

/**
 * @plugin AutoRowHeaderSize
 * @class AutoRowHeaderSize
 *
 * @description
 * The `AutoRowHeaderSize` plugin sizes the row header column to its widest label.
 *
 * It completes a set. {@link AutoColumnSize} sizes a data column to its widest cell, and
 * {@link AutoRowSize} sizes a row to its tallest cell *and* the column header to its tallest
 * label. The row header's width was the one dimension nothing measured - which is why a long
 * column header makes its column grow while a long row header is simply clipped.
 *
 * Turning the plugin on is the only thing you have to do. It takes over the row header's width, so
 * any [`rowHeaderWidth`](@/api/options.md#rowheaderwidth) already set is ignored while the plugin
 * is enabled - there is no second option to keep in step.
 *
 * The plugin is off by default. It reads every row header once to find the longest label, so the
 * cost of that first pass grows with the row count, and switching it on for everyone would change
 * the width of every grid that uses custom row labels. It measures a single row header, so a grid
 * rendering more than one row header level keeps its default widths and is told why in the console.
 *
 * @example
 * ```js
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   rowHeaders: ['Revenue', 'Cost of goods sold', 'Gross profit'],
 *   // size the row header column to the longest label
 *   autoRowHeaderSize: true,
 * });
 * ```
 */
export class AutoRowHeaderSize extends BasePlugin {
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
  static get DEFAULT_SETTINGS(): AutoRowHeaderSizeDefaults {
    return {
      samplingRatio: null,
      allowSampleDuplicates: false,
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
   * Whether the grid has already been told that the plugin does nothing here.
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
    const settings = this.hot.getSettings()[PLUGIN_KEY];

    return settings === true || (typeof settings === 'object' && settings !== null);
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
   * Renders the sampled row headers off-screen and returns the width of the widest one.
   *
   * @returns {number} The measured width in pixels.
   */
  #measure(): number {
    const scannedRows = this.hot.countRows();

    if (scannedRows < 1) {
      return 0;
    }

    // The row header sits at column -1, so the samples are generated for that column across the
    // rows. Only the label lengths matter here - the label itself is re-rendered by the grid's own
    // row header renderers when the ghost table measures it.
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
   * Answers with the measured width.
   *
   * The hook runs on every draw, so everything it does beyond reading the cache has to stay out of
   * this path.
   *
   * The width the grid resolved on its own is deliberately discarded: the plugin is the one that
   * was asked to decide this width, so a `rowHeaderWidth` left over in the settings does not fight
   * it. The default column width is still the floor, so a grid of short labels keeps the header it
   * has today rather than collapsing around a one-character label - the same floor
   * {@link AutoColumnSize#getColumnWidth} keeps for a data column.
   *
   * @param {number} rowHeaderWidth The width Walkontable resolved on its own.
   * @returns {number} The width to use.
   */
  #onModifyRowHeaderWidth = (rowHeaderWidth: number) => {
    if (this.hot.countRowHeaders() > 1) {
      this.#warnAboutHeaderLevels();

      return rowHeaderWidth;
    }

    return Math.max(this.getRowHeaderWidth(), DEFAULT_COLUMN_WIDTH);
  };

  /**
   * Says once why the plugin is doing nothing, so the grid does not just silently keep its old width.
   */
  #warnAboutHeaderLevels() {
    if (this.#warnedAboutHeaderLevels) {
      return;
    }

    this.#warnedAboutHeaderLevels = true;

    warn('The `autoRowHeaderSize` plugin measures a single row header, and this grid renders more ' +
      'than one. The row headers keep their default width. Give each level its own width instead, ' +
      'for example `rowHeaderWidth: [80, 40]`.');
  }

  /**
   * Drops the cached width after a change that can alter the row header labels.
   */
  #onInvalidate = () => {
    this.clearCache();
  };
}
