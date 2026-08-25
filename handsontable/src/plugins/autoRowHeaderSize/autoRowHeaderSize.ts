import { BasePlugin } from '../base';
import GhostTable from '../../utils/ghostTable';
import SamplesGenerator from '../../utils/samplesGenerator';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';

export const PLUGIN_KEY = 'autoRowHeaderSize';
export const PLUGIN_PRIORITY = 45;

/**
 * A function that fills one row header cell, as collected from the `afterGetRowHeaderRenderers` hook.
 */
type RowHeaderRenderer = (renderableRow: number, TH: HTMLTableCellElement) => void;

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
 * A grid can render more than one row header, by pushing a renderer through the
 * {@link Hooks#afterGetRowHeaderRenderers} hook. Every one of them is measured on its own, so each
 * gets exactly the width its own labels need.
 *
 * The plugin is off by default. It reads every row header once to find the longest label, so the
 * cost of that first pass grows with the row count, and switching it on for everyone would change
 * the width of every grid that uses custom row labels.
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
   * Instance of {@link GhostTable} used to measure the row headers off-screen. Private: how the
   * measuring is done is not part of what this plugin offers.
   *
   * @type {GhostTable}
   */
  #ghostTable = new GhostTable(this.hot);
  /**
   * Instance of {@link SamplesGenerator} used to reduce the row headers down to the few labels
   * worth rendering. It buckets them by label length and keeps a handful per bucket, so the DOM
   * work stays flat however many rows there are.
   *
   * @type {SamplesGenerator}
   */
  #samplesGenerator = new SamplesGenerator((row: number) => {
    // A row with no renderable index is hidden, so no header of it is drawn and none is measured.
    if (this.hot.rowIndexMapper.getRenderableFromVisualIndex(row) === null) {
      return false;
    }

    return { value: this.#readLabel(row) };
  });
  /**
   * Reads the label of the level currently being sampled. Swapped per level by `#measureAllLevels`,
   * because each row header draws its own text and has to be bucketed by its own lengths.
   *
   * @type {Function}
   */
  #readLabel: (visualRow: number) => unknown = visualRow => this.hot.getRowHeader(visualRow);
  /**
   * The last measured width of each row header level, or `null` when a measurement is due.
   *
   * @type {number[]|null}
   */
  #cachedWidths: number[] | null = null;
  /**
   * The row counts the cached widths were measured against, as `visible,rendered`.
   *
   * Both halves are needed. The visible count catches rows being added, removed or trimmed. The
   * rendered count catches rows being hidden and shown again, which leaves the visible count
   * untouched - so without it a label that was hidden during the first measurement would stay
   * unmeasured after it reappears, and its header would keep clipping.
   *
   * @type {string}
   */
  #cachedRowCounts = '';

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

    this.#samplesGenerator.setAllowDuplicates(this.getSetting<boolean>('allowSampleDuplicates'));

    const samplingRatio = this.getSetting<number | null>('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.#samplesGenerator.setSampleCount(parseInt(String(samplingRatio), 10));
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
   * Returns the width one row header level needs in order to show its longest label in full.
   *
   * The value is cached, so calling this repeatedly costs nothing until the data or the settings
   * change.
   *
   * @param {number} [headerLevel=0] Which row header to report on, counting from the grid's edge:
   *                                 `0` is the first one. The negative column index a row header
   *                                 sits at is accepted too, so `-1` is that same first header and
   *                                 `-2` the one after it.
   * @returns {number} The measured width in pixels, or `0` when there is nothing to measure.
   */
  getRowHeaderWidth(headerLevel: number = 0): number {
    const widths = this.#getMeasuredWidths();
    // Row headers live at columns -1, -2, ... so a negative argument is read as one of those.
    const level = headerLevel < 0 ? -headerLevel - 1 : headerLevel;

    return widths[level] ?? 0;
  }

  /**
   * Returns the width every row header level needs, in order, starting with the one at the grid's edge.
   *
   * @returns {number[]} The measured widths in pixels.
   */
  getRowHeaderWidths(): number[] {
    return this.#getMeasuredWidths().slice();
  }

  /**
   * Throws the measured widths away, so the next read measures again.
   */
  clearCache(): void {
    this.#cachedWidths = null;
    this.#cachedRowCounts = '';
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#ghostTable.clean();

    super.destroy();
  }

  /**
   * Returns the measured width of every row header level, measuring first if the cache is stale.
   *
   * @returns {number[]}
   */
  #getMeasuredWidths(): number[] {
    if (this.#cachedWidths === null || this.#cachedRowCounts !== this.#getRowCountsKey()) {
      this.#cachedWidths = this.#measureAllLevels();
      this.#cachedRowCounts = this.#getRowCountsKey();
    }

    return this.#cachedWidths;
  }

  /**
   * Returns the row counts the cache is keyed on.
   *
   * @returns {string}
   */
  #getRowCountsKey(): string {
    return `${this.hot.countRows()},${this.hot.rowIndexMapper.getRenderableIndexesLength()}`;
  }

  /**
   * Collects the renderers that fill the row headers, one per level.
   *
   * Built the same way `TableView` builds them for the draw: the grid's own renderer first, then
   * whatever the `afterGetRowHeaderRenderers` hook appends. Collecting them here is what lets every
   * level be measured with the markup it actually renders, rather than assuming the first level's.
   *
   * @returns {Function[]}
   */
  #collectRenderers(): RowHeaderRenderer[] {
    const renderers: RowHeaderRenderer[] = [];

    if (this.hot.hasRowHeaders()) {
      renderers.push((renderableRow: number, TH: HTMLTableCellElement) => {
        const visualRow = renderableRow >= 0
          ? this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderableRow)
          : renderableRow;

        this.hot.view.appendRowHeader(visualRow!, TH);
      });
    }

    this.hot.runHooks('afterGetRowHeaderRenderers', renderers);

    return renderers;
  }

  /**
   * Measures every row header level off-screen.
   *
   * @returns {number[]} One width per level, in order from the grid's edge.
   */
  #measureAllLevels(): number[] {
    const renderers = this.#collectRenderers();

    return renderers.map((renderer, headerLevel) => {
      // Each level is bucketed by the labels IT draws. Sampling every level by the first one's
      // labels would skip the row carrying a later level's longest label, leaving that level narrow.
      this.#readLabel = headerLevel === 0
        ? visualRow => this.hot.getRowHeader(visualRow)
        : visualRow => this.#readRenderedLabel(renderer, visualRow);

      const samples = this.#generateSamples();

      return samples === null ? 0 : this.#measureLevel(samples, renderer, headerLevel);
    });
  }

  /**
   * Reads the text one renderer draws for one row, without laying anything out.
   *
   * The cell is never inserted into the document, so this costs a renderer call and no reflow - the
   * same trade the first level gets for free from `getRowHeader`.
   *
   * @param {Function} renderer The renderer that fills a header cell of this level.
   * @param {number} visualRow The row to read.
   * @returns {string}
   */
  #readRenderedLabel(renderer: RowHeaderRenderer, visualRow: number): string {
    const th = this.hot.rootDocument.createElement('th');

    renderer(this.#toRenderableRow(visualRow), th);

    return th.textContent ?? '';
  }

  /**
   * Translates a visual row into the renderable index the row header renderers are called with.
   *
   * @param {number} visualRow The row to translate.
   * @returns {number}
   */
  #toRenderableRow(visualRow: number): number {
    return this.hot.rowIndexMapper.getRenderableFromVisualIndex(visualRow) ?? visualRow;
  }

  /**
   * Reduces the row headers down to the few labels worth rendering.
   *
   * @returns {Map|null} The samples, or `null` when there is nothing to measure.
   */
  #generateSamples(): Map<string | number, never> | null {
    const totalRows = this.hot.countRows();

    if (totalRows < 1) {
      return null;
    }

    // The row header sits at column -1, so the samples are generated for that column across the
    // rows. Only the label lengths matter here - the label itself is re-rendered by the grid's own
    // row header renderers when the ghost table measures it.
    const samplesByColumn = this.#samplesGenerator
      .generateColumnSamples(-1, { from: 0, to: totalRows - 1 });
    // `generateColumnSamples` keys its result by column index; the per-label-length samples are the
    // value inside. AutoColumnSize unwraps the same way before handing them to the ghost table.
    const samples = samplesByColumn.get(-1) as Map<string | number, never> | undefined;

    return samples && samples.size > 0 ? samples : null;
  }

  /**
   * Renders one row header level off-screen and returns the width of its widest cell.
   *
   * @param {Map} samples The sampled rows to render.
   * @param {Function} renderer The renderer that fills a header cell of this level.
   * @param {number} headerLevel The level being measured, counting from the grid's edge.
   * @returns {number} The measured width in pixels.
   */
  #measureLevel(samples: Map<string | number, never>, renderer: RowHeaderRenderer, headerLevel: number): number {
    let width = 0;

    try {
      // The ghost table takes the map over, and its `clean()` clears whatever it was handed - so it
      // gets a copy, never the generator's own map.
      this.#ghostTable.addRowHeadersColumn(new Map(samples), headerLevel, (visualRow, TH) => {
        // The renderers are called by the draw with renderable indexes, so they get one here too.
        renderer(this.#toRenderableRow(visualRow), TH);
      });
      this.#ghostTable.getWidths((_column: number, measuredWidth: number) => {
        width = Math.max(width, measuredWidth);
      });
    } finally {
      // A throwing row header renderer must not leave the measurement table attached to the DOM.
      this.#ghostTable.clean();
    }

    return width;
  }

  /**
   * Answers with the measured width of every row header level.
   *
   * The hook runs on every draw, so everything it does beyond reading the cache has to stay out of
   * this path.
   *
   * A single level is answered with a plain number, and several with one width per level. Both
   * shapes are understood by the two places that consume this: `ColumnUtils` indexes an array per
   * level, and `Viewport` adds the entries up to get the width of the whole row header block.
   *
   * The width the grid resolved on its own is deliberately discarded: the plugin is the one that
   * was asked to decide this width, so a `rowHeaderWidth` left over in the settings does not fight
   * it. The default column width is still the floor of every level, so a grid of short labels keeps
   * the header it has today rather than collapsing around a one-character label - the same floor
   * {@link AutoColumnSize#getColumnWidth} keeps for a data column.
   *
   * @param {number|number[]} rowHeaderWidth The width Walkontable resolved on its own.
   * @returns {number|number[]} The width to use.
   */
  #onModifyRowHeaderWidth = (rowHeaderWidth: number | number[]) => {
    const widths = this.#getMeasuredWidths();

    if (widths.length === 0) {
      return rowHeaderWidth;
    }

    const flooredWidths = widths.map(width => Math.max(width, DEFAULT_COLUMN_WIDTH));

    return flooredWidths.length === 1 ? flooredWidths[0] : flooredWidths;
  };

  /**
   * Drops the cached widths after a change that can alter the row header labels.
   */
  #onInvalidate = () => {
    this.clearCache();
  };
}
