import { BasePlugin } from '../base';
import GhostTable from '../../utils/ghostTable';
import SamplesGenerator from '../../utils/samplesGenerator';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import { cancelIdleTask, requestIdleTask } from '../../helpers/feature';
import { isPercentValue } from '../../helpers/string';
import { valueAccordingPercent } from '../../helpers/number';

export const PLUGIN_KEY = 'autoRowHeaderSize';
export const PLUGIN_PRIORITY = 45;

/**
 * A function that fills one row header cell, as collected from the `afterGetRowHeaderRenderers` hook.
 */
type RowHeaderRenderer = (renderableRow: number, TH: HTMLTableCellElement) => void;

/**
 * The per-label-length buckets a sweep accumulates. The bucket shape belongs to
 * {@link SamplesGenerator} and is not exported, so it is kept opaque here - this plugin only ever
 * hands the buckets straight back to the sampler or on to the ghost table.
 */
type LabelSamples = Map<string | number, never>;

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
  /**
   * How many rows are read before the first paint. The rest are read in the browser's idle time.
   */
  syncLimit?: number | string;
}

/**
 * The plugin's settings with every default resolved.
 */
type AutoRowHeaderSizeDefaults = {
  samplingRatio: number | null;
  allowSampleDuplicates: boolean;
  syncLimit: number | string;
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
 * Finding the longest label means reading every row header once, so on a large grid the work is
 * split the same way {@link AutoRowSize} splits its own: the first
 * [`syncLimit`](@/api/options.md#autorowheadersize) rows are read before the first paint, and the
 * rest are swept in the browser's idle time. A header can therefore widen a moment after the grid
 * appears. It only ever widens while the sweep runs, so the width never jumps back and forth.
 *
 * The plugin is off by default, because switching it on for everyone would change the width of
 * every grid that uses custom row labels.
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
   * Returns the number of rows read before the first paint, when `syncLimit` says nothing else.
   *
   * Every existing unit test runs on fewer rows than this, so they measure synchronously and never
   * have to drive the idle sweep.
   *
   * @returns {number}
   */
  static get SYNC_CALCULATION_LIMIT() {
    return 500;
  }

  /**
   * Returns the number of rows read between two checks of the chunk's time budget.
   *
   * @returns {number}
   */
  static get CALCULATION_STEP() {
    return 1000;
  }

  /**
   * Returns how long one idle chunk may spend reading labels, in milliseconds.
   *
   * A row count alone would be either wasteful or unsafe: reading a label costs well under a
   * microsecond for the first header level and several times that for each level added through the
   * hook, so the same number of rows is a rounding error in one grid and a dropped frame in
   * another. Going by time keeps a chunk inside a frame either way, which matters because
   * `requestIdleCallback` is missing on some supported browsers - there the chunk runs in an
   * animation frame instead.
   *
   * @returns {number}
   */
  static get CALCULATION_BUDGET() {
    return 8;
  }

  /**
   * Returns the breathing space added to every measured level, in pixels.
   *
   * The ghost table measures the cell exactly as it renders, which is a problem when a row header
   * renderer writes its text straight into the `th`: the grid's own renderer wraps the label in a
   * padded element, but a renderer pushed through the hook has no padding at all, so an exact
   * measurement leaves the longest label flush against the cell border. Rather than require every
   * renderer to style itself, the width carries a small allowance.
   *
   * @returns {number}
   */
  static get MEASUREMENT_PADDING() {
    return 8;
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
      syncLimit: AutoRowHeaderSize.SYNC_CALCULATION_LIMIT,
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
   * Reads the label of the level currently being sampled. Swapped per level while sweeping,
   * because each row header draws its own text and has to be bucketed by its own lengths.
   *
   * @type {Function}
   */
  #readLabel: (visualRow: number) => unknown = visualRow => this.hot.getRowHeader(visualRow);
  /**
   * The one cell the label reads borrow. Reusing it keeps a sweep from creating an element per row.
   *
   * @type {HTMLTableCellElement|null}
   */
  #labelProbe: HTMLTableCellElement | null = null;
  /**
   * The width of each row header level as currently reported to the grid, or `null` before the
   * first measurement.
   *
   * @type {number[]|null}
   */
  #cachedWidths: number[] | null = null;
  /**
   * The row counts the reported widths belong to, as `visible,rendered`.
   *
   * Both halves are needed. The visible count catches rows being added, removed or trimmed. The
   * rendered count catches rows being hidden and shown again, which leaves the visible count
   * untouched - so without it a label that was hidden during the first measurement would stay
   * unmeasured after it reappears, and its header would keep clipping. A change to either half
   * mid-sweep restarts the sweep, so hiding a row while one is running heals itself.
   *
   * @type {string}
   */
  #cachedRowCounts = '';
  /**
   * `true` while rows are still being read in the browser's idle time.
   *
   * @type {boolean}
   */
  #inProgress = false;
  /**
   * The label buckets the sweep in progress has filled so far, one map per level.
   *
   * @type {Map[]|null}
   */
  #sweepSamples: LabelSamples[] | null = null;
  /**
   * The renderers the sweep in progress is reading through, captured when it started.
   *
   * @type {Function[]}
   */
  #sweepRenderers: RowHeaderRenderer[] = [];
  /**
   * The next row the sweep in progress will read.
   *
   * @type {number}
   */
  #sweepCursor = 0;
  /**
   * How many labels each level had bucketed when it was last measured. A level whose buckets have
   * not taken anything new cannot have changed width, so it does not have to be measured again.
   *
   * @type {number[]}
   */
  #sweepMeasuredFrom: number[] = [];
  /**
   * What the sweep last measured for each level, kept so an unchanged level can be reported again
   * without touching the DOM.
   *
   * @type {number[]}
   */
  #sweepWidths: number[] = [];
  /**
   * The scheduled idle chunk, or `null` when nothing is scheduled.
   *
   * @type {number|null}
   */
  #idleTaskId: number | null = null;
  /**
   * Guards the measurement against being re-entered by a draw it triggers itself.
   *
   * @type {boolean}
   */
  #measuring = false;
  /**
   * Rows whose labels have changed and still have to be measured, or `null` when there are none.
   *
   * @type {Set|null}
   */
  #pendingRows: Set<number> | null = null;
  /**
   * The scheduled task that measures the pending rows, or `null` when nothing is scheduled.
   *
   * @type {number|null}
   */
  #pendingTaskId: number | null = null;

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
    this.addHook('afterColumnSort', this.#onInvalidate);
    this.addHook('afterSetDataAtCell', this.#onCellsChange);

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
   * Returns how many rows are read before the first paint.
   *
   * A plain number is taken as it is, and a percent string is resolved against the row count, the
   * way {@link AutoColumnSize} resolves its own. Anything else keeps the default, so an object
   * config that only sets `samplingRatio` still gets a measured first paint.
   *
   * @returns {number}
   */
  getSyncCalculationLimit(): number {
    const lastRow = this.hot.countRows() - 1;
    const setting = this.getSetting<number | string>('syncLimit');
    let limit: number = AutoRowHeaderSize.SYNC_CALCULATION_LIMIT;

    if (typeof setting === 'string' && isPercentValue(setting)) {
      limit = valueAccordingPercent(lastRow, setting);
    } else {
      const numericLimit = Number(setting);

      if (Number.isFinite(numericLimit)) {
        limit = Math.trunc(numericLimit);
      }
    }

    return Math.min(limit, lastRow);
  }

  /**
   * Returns the width one row header level needs in order to show its longest label in full.
   *
   * On a grid larger than `syncLimit` this can still be growing - the rows past that limit are read
   * in the browser's idle time, so a level can report a wider figure a moment later.
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
    this.#cancelSweep();
    this.#cancelPendingRows();

    this.#cachedWidths = null;
    this.#cachedRowCounts = '';
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#cancelSweep();
    this.#cancelPendingRows();
    this.#ghostTable.clean();
    this.#labelProbe = null;

    super.destroy();
  }

  /**
   * Returns the width of every row header level, starting a measurement when one is due.
   *
   * @returns {number[]}
   */
  #getMeasuredWidths(): number[] {
    // A row header renderer that draws through the grid could bring the draw back around to this
    // hook. Answering with what is already known keeps that from recursing.
    if (this.#measuring) {
      return this.#cachedWidths ?? [];
    }

    if (this.#cachedWidths === null || this.#cachedRowCounts !== this.#getRowCountsKey()) {
      this.#startSweep();
    }

    return this.#cachedWidths ?? [];
  }

  /**
   * Returns the row counts the reported widths are keyed on.
   *
   * @returns {string}
   */
  #getRowCountsKey(): string {
    return `${this.hot.countRows()},${this.hot.rowIndexMapper.getRenderableIndexesLength()}`;
  }

  /**
   * Starts reading the row headers again from the top.
   *
   * The rows up to `syncLimit` are read straight away, so the first paint has a width to use. The
   * rest are left to {@link AutoRowHeaderSize#CALCULATION_STEP}-sized chunks in idle time.
   */
  #startSweep(): void {
    this.#cancelSweep();
    this.#cachedRowCounts = this.#getRowCountsKey();

    const totalRows = this.hot.countRows();

    if (totalRows < 1) {
      this.#cachedWidths = [];

      return;
    }

    this.#sweepRenderers = this.#collectRenderers();
    this.#sweepSamples = this.#sweepRenderers.map(() => new Map() as LabelSamples);
    this.#sweepMeasuredFrom = this.#sweepRenderers.map(() => -1);
    this.#sweepWidths = this.#sweepRenderers.map(() => 0);
    this.#sweepCursor = 0;

    this.#readRows(Math.min(this.getSyncCalculationLimit(), totalRows - 1));

    const finished = this.#sweepCursor >= totalRows;

    this.#commitWidths(finished);

    if (finished) {
      // A grid smaller than the sync limit is done here. No draw is asked for: this runs inside one.
      this.#releaseSweep();
    } else {
      this.#inProgress = true;
      this.#scheduleChunk();
    }
  }

  /**
   * Lets go of what a finished sweep was carrying.
   */
  #releaseSweep(): void {
    this.#sweepSamples = null;
    this.#sweepRenderers = [];
    this.#inProgress = false;
  }

  /**
   * Stops the sweep in progress and forgets what it had collected.
   */
  #cancelSweep(): void {
    if (this.#idleTaskId !== null) {
      cancelIdleTask(this.#idleTaskId);
      this.#idleTaskId = null;
    }

    this.#sweepSamples = null;
    this.#sweepRenderers = [];
    this.#sweepCursor = 0;
    this.#inProgress = false;
  }

  /**
   * Queues the next chunk of rows.
   */
  #scheduleChunk(): void {
    this.#idleTaskId = requestIdleTask(() => {
      this.#idleTaskId = null;

      // The instance can be gone by the time an idle task runs.
      if (!this.hot || !this.enabled || this.#sweepSamples === null) {
        this.#cancelSweep();

        return;
      }

      const totalRows = this.hot.countRows();
      const budgetEnd = performance.now() + AutoRowHeaderSize.CALCULATION_BUDGET;

      // Reading is cheap enough that a fixed row count would leave most of the frame unused, and
      // on a grid with several header levels it would overrun it. The budget settles both.
      do {
        this.#readRows(Math.min(this.#sweepCursor + AutoRowHeaderSize.CALCULATION_STEP - 1, totalRows - 1));
      } while (this.#sweepCursor < totalRows && performance.now() < budgetEnd);

      const finished = this.#sweepCursor >= totalRows;
      const changed = this.#commitWidths(finished);

      if (finished) {
        this.#releaseSweep();
      } else {
        this.#scheduleChunk();
      }

      // Nothing else is going to draw: the chunk runs on its own, between draws. And a draw is what
      // it takes - the per-level widths are written to the `col` elements by `calculateWidths()`
      // during one, so resizing the overlays would not move them. Without this the label that made
      // the header wider stays clipped until some unrelated render happens to come along.
      if (changed) {
        this.hot.render();
      }
    });
  }

  /**
   * Reads the labels of every level for the rows from the sweep's cursor up to `lastRow`.
   *
   * @param {number} lastRow The last row to read, inclusive.
   */
  #readRows(lastRow: number): void {
    if (this.#sweepSamples === null || lastRow < this.#sweepCursor) {
      return;
    }

    const range = { from: this.#sweepCursor, to: lastRow };

    this.#sweepRenderers.forEach((renderer, headerLevel) => {
      this.#collectSamples(this.#sweepSamples![headerLevel], renderer, headerLevel, range);
    });

    this.#sweepCursor = lastRow + 1;
  }

  /**
   * Buckets the labels one level draws for the given rows, adding to what is already bucketed.
   *
   * @param {Map} samples The buckets to add to.
   * @param {Function} renderer The renderer that fills a header cell of this level.
   * @param {number} headerLevel The level being read, counting from the grid's edge.
   * @param {object|Array} range The rows to read - a `from`/`to` range, or a list of row indexes.
   */
  #collectSamples(
    samples: LabelSamples,
    renderer: RowHeaderRenderer,
    headerLevel: number,
    range: { from: number, to: number } | number[]
  ): void {
    // Each level is bucketed by the labels IT draws. Sampling every level by the first one's
    // labels would skip the row carrying a later level's longest label, leaving that level narrow.
    this.#readLabel = headerLevel === 0
      ? visualRow => this.hot.getRowHeader(visualRow)
      : visualRow => this.#readRenderedLabel(renderer, visualRow);

    // The row header sits at column -1, so the samples are generated for that column across the
    // rows. Passing the buckets back in is what lets a sweep run in slices: the per-bucket limits
    // and the duplicate detection keep working across all of them.
    this.#samplesGenerator.generateSample('col', range, -1, samples as never);
  }

  /**
   * Measures whatever the sweep has bucketed so far and reports it.
   *
   * While the sweep runs a level can only widen. Reading more rows can only turn up a longer label,
   * so widening converges on the answer without the width jumping back and forth. The final call
   * is the one allowed to report a narrower width, because by then every row has been read - which
   * is what lets a header shrink again after its longest label is deleted.
   *
   * @param {boolean} isFinal Whether every row has now been read.
   * @returns {boolean} Whether the reported widths moved.
   */
  #commitWidths(isFinal: boolean): boolean {
    if (this.#sweepSamples === null) {
      return false;
    }

    const measured = this.#sweepSamples.map((samples, headerLevel) => {
      const bucketed = this.#countBucketed(samples);

      // Laying the samples out is the expensive half. A chunk that turned up no label the sampler
      // wanted to keep cannot have changed this level, so the last measurement still stands.
      if (bucketed !== this.#sweepMeasuredFrom[headerLevel]) {
        this.#sweepMeasuredFrom[headerLevel] = bucketed;
        this.#sweepWidths[headerLevel] = bucketed === 0
          ? 0
          : this.#measureLevel(samples, this.#sweepRenderers[headerLevel], headerLevel);
      }

      return this.#sweepWidths[headerLevel];
    });
    const previous = this.#cachedWidths;

    // A renderer added or removed since the last sweep changes how many levels there are, so there
    // is no level to compare against - the fresh measurement stands on its own.
    const next = isFinal || previous === null || previous.length !== measured.length
      ? measured
      : measured.map((width, headerLevel) => Math.max(width, previous[headerLevel]));

    this.#cachedWidths = next;

    return previous === null
      || previous.length !== next.length
      || next.some((width, headerLevel) => width !== previous[headerLevel]);
  }

  /**
   * Counts the labels a level has kept, across all of its length buckets.
   *
   * @param {Map} samples The buckets to count.
   * @returns {number}
   */
  #countBucketed(samples: LabelSamples): number {
    let total = 0;

    samples.forEach((bucket: { strings: unknown[] }) => {
      total += bucket.strings.length;
    });

    return total;
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
   * Reads the text one renderer draws for one row, without laying anything out.
   *
   * The cell is never inserted into the document, so this costs a renderer call and no reflow - the
   * same trade the first level gets for free from `getRowHeader`. One cell is reused for the whole
   * sweep: creating one per row was the single biggest cost of reading a level added through the
   * hook. It is emptied first, so a renderer that appends children does not pile them up.
   *
   * @param {Function} renderer The renderer that fills a header cell of this level.
   * @param {number} visualRow The row to read.
   * @returns {string}
   */
  #readRenderedLabel(renderer: RowHeaderRenderer, visualRow: number): string {
    if (this.#labelProbe === null) {
      this.#labelProbe = this.hot.rootDocument.createElement('th');
    }

    const th = this.#labelProbe;

    th.textContent = '';

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
   * Renders one row header level off-screen and returns the width of its widest cell.
   *
   * @param {Map} samples The sampled rows to render.
   * @param {Function} renderer The renderer that fills a header cell of this level.
   * @param {number} headerLevel The level being measured, counting from the grid's edge.
   * @returns {number} The measured width in pixels.
   */
  #measureLevel(samples: LabelSamples, renderer: RowHeaderRenderer, headerLevel: number): number {
    let width = 0;

    this.#measuring = true;

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
      this.#measuring = false;
    }

    // Nothing measured stays nothing, so an unrendered level is not padded into existence.
    return width === 0 ? 0 : width + AutoRowHeaderSize.MEASUREMENT_PADDING;
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
   * Drops the measured widths after a change that can alter the row header labels.
   */
  #onInvalidate = () => {
    this.clearCache();
  };

  /**
   * Widens the row headers, if the cells that just changed carry longer labels than before.
   *
   * A row header label usually has nothing to do with the cell values, but it can be built from
   * them - a data column used as the label, for instance - so a change still has to be looked at.
   * Only the rows named in the change are read, which is what keeps the cost of an edit away from
   * the size of the grid.
   *
   * The width can only grow here. Working out that it should *shrink* means finding the new longest
   * label, which no shortcut avoids, so that is left to the next full sweep.
   *
   * @param {Array} changes The `[row, prop, oldValue, newValue]` entries that were applied.
   */
  #onCellsChange = (changes: unknown[][] | null) => {
    if (!Array.isArray(changes) || changes.length === 0 || this.#cachedWidths === null) {
      return;
    }

    // A sweep in progress has already read some of these rows, and it holds their old labels. It is
    // cheaper to start it over than to work out which of them it still has to revisit.
    if (this.#inProgress) {
      this.clearCache();

      return;
    }

    // A paste hits the same row once per column, so the rows are collected as a set - and onto
    // whatever is already waiting, since one task measures the lot.
    const rows = this.#pendingRows ?? new Set<number>();

    changes.forEach(change => rows.add(change[0] as number));

    // Past a certain number of ROWS - not changes - reading them one by one costs more than
    // sweeping the grid again, and a sweep also lets the headers shrink. Counting changes instead
    // would send a paste that is merely wide, a few rows across many columns, down the expensive
    // path for no reason.
    if (rows.size > AutoRowHeaderSize.SYNC_CALCULATION_LIMIT) {
      this.clearCache();

      return;
    }

    this.#pendingRows = rows;

    this.#schedulePendingRows();
  };

  /**
   * Queues the measurement of the rows whose labels have changed.
   *
   * The measuring deliberately does NOT happen in the hook. The hook runs inside the edit, with a
   * draw either under way or about to be, and a ghost table measured at that moment comes back too
   * small - so a header that should have grown silently stayed as it was. One task drains whatever
   * has collected by the time it runs, so a burst of edits costs one measurement.
   */
  #schedulePendingRows(): void {
    if (this.#pendingTaskId !== null) {
      return;
    }

    this.#pendingTaskId = requestIdleTask(() => {
      this.#pendingTaskId = null;

      const rows = this.#pendingRows === null ? [] : Array.from(this.#pendingRows);

      this.#pendingRows = null;

      // The instance can be gone, or the cache dropped, by the time this runs.
      if (!this.hot || !this.enabled || this.#cachedWidths === null || rows.length === 0) {
        return;
      }

      if (this.#widenFor(rows)) {
        this.hot.render();
      }
    });
  }

  /**
   * Drops a queued measurement of changed rows.
   */
  #cancelPendingRows(): void {
    if (this.#pendingTaskId !== null) {
      cancelIdleTask(this.#pendingTaskId);
      this.#pendingTaskId = null;
    }

    this.#pendingRows = null;
  }

  /**
   * Grows any level whose label on one of the given rows is now wider than the level itself.
   *
   * @param {number[]} rows The rows to read.
   * @returns {boolean} Whether any level grew.
   */
  #widenFor(rows: number[]): boolean {
    const renderers = this.#collectRenderers();

    if (renderers.length !== this.#cachedWidths!.length) {
      this.clearCache();

      return false;
    }

    let widened = false;

    renderers.forEach((renderer, headerLevel) => {
      const samples = new Map() as LabelSamples;

      this.#collectSamples(samples, renderer, headerLevel, rows);

      if (samples.size === 0) {
        return;
      }

      const width = this.#measureLevel(samples, renderer, headerLevel);

      if (width > this.#cachedWidths![headerLevel]) {
        this.#cachedWidths![headerLevel] = width;
        widened = true;
      }
    });

    return widened;
  }
}
