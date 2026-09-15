import type { HotInstance } from '../../core/types';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import { getScrollbarWidth } from '../../helpers/dom/element';
import { StretchAllStrategy } from './strategies/all';
import { StretchLastStrategy } from './strategies/last';

const STRETCH_WIDTH_MAP_NAME = 'stretchColumns';

/**
 * The class responsible for calculating the column widths based on the specified column stretching strategy.
 *
 * @private
 * @class StretchCalculator
 */
export class StretchCalculator {
  /**
   * The Handsontable instance.
   *
   * @type {Core}
   */
  readonly #hot;
  /**
   * The map that stores the calculated column widths.
   *
   * @type {IndexToValueMap}
   */
  readonly #widthsMap;
  /**
   * The map that stores the available stretch strategies.
   *
   * @type {Map<string, StretchAllStrategy | StretchLastStrategy>}
   */
  readonly #stretchStrategies = new Map([
    ['all', new StretchAllStrategy(this.#overwriteColumnWidthFn.bind(this))],
    ['last', new StretchLastStrategy(this.#overwriteColumnWidthFn.bind(this))],
  ]);
  /**
   * The active stretch mode.
   *
   * @type {'all' | 'last' | 'none'}
   */
  #activeStrategy = 'none';
  /**
   * Whether the viewport is being measured for the next calculation. While set, the plugin hides its
   * own stretched widths from `modifyColWidth`, so the measurement sums the base widths — exactly what
   * clearing the map before the measurement used to give it.
   *
   * @type {boolean}
   */
  #isMeasuringViewport = false;

  /**
   * Initializes the stretch columns calculator with the Handsontable instance and registers the stretch widths index map.
   */
  constructor(hotInstance: HotInstance) {
    this.#hot = hotInstance;
    this.#widthsMap = this.#hot.columnIndexMapper
      .createAndRegisterIndexMap(STRETCH_WIDTH_MAP_NAME, 'physicalIndexToValue');
  }

  /**
   * Sets the active stretch strategy.
   *
   * @param {'all' | 'last' | 'none'} strategyName The stretch strategy to use.
   */
  useStrategy(strategyName: unknown) {
    this.#activeStrategy = typeof strategyName === 'string' && this.#stretchStrategies.has(strategyName)
      ? strategyName
      : 'none';
  }

  /**
   * Recalculates the column widths.
   *
   * The result is written to the widths map with a single `setValues()` call, and only when it
   * differs from what the map already holds. Two consumers depend on that shape. The `change`
   * hook of the map is what a caller of `observeMapChange` sees, so one write means one
   * notification per real change and none in steady state. And the engine's column-width
   * prefix-sum cache (`Viewport#columnWidthCache`) is keyed on the item COUNT only — a stretched
   * width that moves keeps the count, so the cache has to be dropped explicitly, the way
   * `ManualColumnResize` and `AutoColumnSize` drop it when their maps change. Left in place, the
   * cache fed the layout snapshot the PREVIOUS total, the solver predicted scrollbars for a grid
   * that had none, and the top overlay clipped the last header by the scrollbar width (DEV-2902).
   */
  refreshStretching() {
    const nextValues: Array<number | null> = new Array<number | null>(this.#widthsMap.getLength()).fill(null);
    const stretchStrategy = this.#activeStrategy === 'none'
      ? undefined
      : this.#stretchStrategies.get(this.#activeStrategy);

    if (stretchStrategy) {
      stretchStrategy.prepare({
        viewportWidth: this.#measureViewportWidth(),
      });

      for (let columnIndex = 0; columnIndex < this.#hot.countCols(); columnIndex++) {
        if (!this.#hot.columnIndexMapper.isHidden(this.#hot.toPhysicalColumn(columnIndex))) {
          stretchStrategy.setColumnBaseWidth(columnIndex, this.#getWidthWithoutStretching(columnIndex));
        }
      }

      stretchStrategy.calculate();

      stretchStrategy.getWidths().forEach(([columnIndex, width]) => {
        nextValues[this.#hot.toPhysicalColumn(columnIndex)] = width;
      });
    }

    this.#applyWidths(nextValues);
  }

  /**
   * Writes the calculated widths to the map when they differ from the stored ones, and drops the
   * engine's column-width cache in the same step so the draw that follows sums the new widths.
   * The invalidation is bound to this single write path rather than to the map itself (the way
   * ManualColumnResize and AutoColumnSize bind theirs through observeMapChange), so any future
   * second writer of the map must call it too.
   *
   * @param {Array<number | null>} nextValues The stretched width per physical column, `null` where
   *                                          the column is not stretched.
   */
  #applyWidths(nextValues: Array<number | null>): void {
    const currentValues = this.#widthsMap.getValues();
    const changed = currentValues.length !== nextValues.length ||
      nextValues.some((value, index) => !Object.is(currentValues[index], value));

    if (!changed) {
      return;
    }

    this.#widthsMap.setValues(nextValues);
    this.#hot.view.invalidateColumnWidthCache();
  }

  /**
   * Gets the calculated column width.
   *
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number | null}
   */
  getStretchedWidth(columnVisualIndex: number) {
    if (this.#isMeasuringViewport) {
      return null;
    }

    return this.#widthsMap.getValueAtIndex(this.#hot.toPhysicalColumn(columnVisualIndex));
  }

  /**
   * Measures the width the strategy stretches into, with the plugin's own stretched widths hidden.
   *
   * When the window owns the horizontal axis, `Viewport#measureWorkspaceWidth` sums the columns live
   * through `modifyColWidth` to decide between the holder's width and the document's client width.
   * With the previous stretched widths still answering that hook, a shrink sums to the OLD viewport,
   * which is wider than the new holder, so the measurement falls through to the document width and
   * the columns overshoot the root by the page's margins — and stay there, because the next refresh
   * reads the same overshoot back. Clearing the map before measuring used to prevent that as a side
   * effect; hiding the widths for the duration of the measurement keeps the behavior without a map
   * write. The engine cannot build its column-width cache in between: with this plugin's hook
   * registered the column widths are not uniform, so `getViewportWidth()` measures the DOM directly
   * instead of resolving the layout snapshot.
   *
   * @returns {number} The viewport width in pixels, less the vertical scrollbar about to appear.
   */
  #measureViewportWidth(): number {
    this.#isMeasuringViewport = true;

    try {
      let viewportWidth = this.#hot.view.getViewportWidth();

      if (this.#willVerticalScrollAppear()) {
        viewportWidth -= getScrollbarWidth(this.#hot.rootDocument);
      }

      return viewportWidth;
    } finally {
      this.#isMeasuringViewport = false;
    }
  }

  /**
   * Checks if the vertical scrollbar will appear. Based on the current data and viewport size
   * the method calculates if the vertical scrollbar will appear after the table is rendered.
   * The method is a workaround for the issue in the Walkontable that returns unstable viewport
   * size.
   *
   * @returns {boolean}
   */
  #willVerticalScrollAppear() {
    const { view, stylesHandler } = this.#hot;

    if (view.isVerticallyScrollableByWindow()) {
      return false;
    }

    const viewportHeight = view.getViewportHeight();
    const totalRows = this.#hot.countRows();
    const defaultRowHeight = stylesHandler.getDefaultRowHeight();
    let totalHeight = 0;
    let hasVerticalScroll = false;

    for (let row = 0; row < totalRows; row++) {
      if (this.#hot.rowIndexMapper.isHidden(this.#hot.toPhysicalRow(row))) {
        // eslint-disable-next-line no-continue
        continue;
      }

      totalHeight += (this.#hot.getRowHeight(row) ?? defaultRowHeight);

      if (totalHeight > viewportHeight) {
        hasVerticalScroll = true;
        break;
      }
    }

    return hasVerticalScroll;
  }

  /**
   * Gets the column width from the Handsontable API without logic related to stretching.
   *
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number}
   */
  #getWidthWithoutStretching(columnVisualIndex: number) {
    return this.#hot.getColWidth(columnVisualIndex, 'StretchColumns') ?? DEFAULT_COLUMN_WIDTH;
  }

  /**
   * Executes the hook that allows to overwrite the column width.
   *
   * @param {number} columnWidth The column width.
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number}
   */
  #overwriteColumnWidthFn(columnWidth: number, columnVisualIndex: number): number {
    return this.#hot.runHooks('beforeStretchingColumnWidth', columnWidth, columnVisualIndex) as number;
  }
}
