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
  #hot;
  /**
   * The map that stores the calculated column widths.
   *
   * @type {IndexToValueMap}
   */
  #widthsMap;
  /**
   * The map that stores the available stretch strategies.
   *
   * @type {Map<string, StretchAllStrategy | StretchLastStrategy>}
   */
  #stretchStrategies = new Map([
    ['all', new StretchAllStrategy(this.#overwriteColumnWidthFn.bind(this))],
    ['last', new StretchLastStrategy(this.#overwriteColumnWidthFn.bind(this))],
  ]);
  /**
   * The active stretch mode.
   *
   * @type {'all' | 'last' | 'none'}
   */
  #activeStrategy = 'none';

  constructor(hotInstance) {
    this.#hot = hotInstance;
    this.#widthsMap = this.#hot.columnIndexMapper
      .createAndRegisterIndexMap(STRETCH_WIDTH_MAP_NAME, 'physicalIndexToValue');
  }

  /**
   * Sets the active stretch strategy.
   *
   * @param {'all' | 'last' | 'none'} strategyName The stretch strategy to use.
   */
  useStrategy(strategyName) {
    this.#activeStrategy = this.#stretchStrategies.has(strategyName) ? strategyName : 'none';
  }

  /**
   * Recalculates the column widths.
   */
  refreshStretching() {
    if (this.#activeStrategy === 'none') {
      this.#widthsMap.clear();

      return;
    }

    this.#hot.batchExecution(() => {
      this.#widthsMap.clear();

      const stretchStrategy = this.#stretchStrategies.get(this.#activeStrategy);
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
        this.#widthsMap.setValueAtIndex(this.#hot.toPhysicalColumn(columnIndex), width);
      });
    }, true);
  }

  /**
   * Gets the calculated column width.
   *
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number | null}
   */
  getStretchedWidth(columnVisualIndex) {
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
    const { view } = this.#hot;

    if (view.isVerticallyScrollableByWindow()) {
      return false;
    }

    const viewportHeight = view.getViewportHeight();
    const totalRows = this.#hot.countRows();
    const defaultRowHeight = view.getStylesHandler().getDefaultRowHeight();
    let totalHeight = 0;
    let hasVerticalScroll = false;

    for (let row = 0; row < totalRows; row++) {
      totalHeight += (this.#hot.getRowHeight(row) ?? defaultRowHeight) + (row === 0 ? 1 : 0);

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
  #getWidthWithoutStretching(columnVisualIndex) {
    return this.#hot.getColWidth(columnVisualIndex, 'StretchColumns') ?? DEFAULT_COLUMN_WIDTH;
  }

  /**
   * Executes the hook that allows to overwrite the column width.
   *
   * @param {number} columnWidth The column width.
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number}
   */
  #overwriteColumnWidthFn(columnWidth, columnVisualIndex) {
    return this.#hot.runHooks('beforeStretchingColumnWidth', columnWidth, columnVisualIndex);
  }
}
