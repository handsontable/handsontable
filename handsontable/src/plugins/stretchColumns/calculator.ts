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
      const view = this.#hot.view;
      let viewportWidth = view.getViewportWidth();

      if (this.#willVerticalScrollAppear()) {
        viewportWidth -= getScrollbarWidth(this.#hot.rootDocument);
      }

      stretchStrategy.prepare({
        viewportWidth,
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
   *
   * @param {Array<number | null>} nextValues The stretched width per physical column, `null` where
   *                                          the column is not stretched.
   * @returns {boolean} `true` when the map changed.
   */
  #applyWidths(nextValues: Array<number | null>): boolean {
    const currentValues = this.#widthsMap.getValues();
    const changed = currentValues.length !== nextValues.length ||
      nextValues.some((value, index) => currentValues[index] !== value);

    if (!changed) {
      return false;
    }

    this.#widthsMap.setValues(nextValues);
    this.#hot.view.invalidateColumnWidthCache();

    return true;
  }

  /**
   * Gets the calculated column width.
   *
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number | null}
   */
  getStretchedWidth(columnVisualIndex: number) {
    return this.#widthsMap.getValueAtIndex(this.#hot.toPhysicalColumn(columnVisualIndex));
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
