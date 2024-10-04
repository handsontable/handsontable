import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
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
    ['all', new StretchAllStrategy()],
    ['last', new StretchLastStrategy()],
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

    let viewportWidth = this.#hot.view.getViewportWidth();
    let allColumnsWidth = 0;
    const nonFixedColumns = [];

    for (let columnIndex = 0; columnIndex < this.#hot.countCols(); columnIndex++) {
      if (this.#hot.columnIndexMapper.isHidden(this.#hot.toPhysicalColumn(columnIndex))) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const columnWidth = this.#getWidthWithoutStretching(columnIndex);
      const fixedWidth = this.#hot.runHooks('beforeStretchingColumnWidth', undefined, columnIndex);

      if (typeof fixedWidth === 'number') {
        viewportWidth -= fixedWidth;

      } else {
        allColumnsWidth += columnWidth;

        if (this.#activeStrategy === 'all') {
          nonFixedColumns.push(columnIndex);
        }
      }

      if (this.#activeStrategy === 'last') {
        nonFixedColumns.push(columnIndex);
      }
    }

    this.#hot.batchExecution(() => {
      this.#widthsMap.clear();

      const stretchStrategy = this.#stretchStrategies.get(this.#activeStrategy);

      stretchStrategy.prepare({
        overwriteColumnWidthFn: (...args) => this.#hot.runHooks('beforeStretchingColumnWidth', ...args),
        allColumnsWidth,
        viewportWidth,
      });

      nonFixedColumns.forEach((columnIndex) => {
        stretchStrategy.calculate(columnIndex, this.#getWidthWithoutStretching(columnIndex));
      });

      stretchStrategy.finish();

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
   * Gets the column width from the Handsontable API without logic related to stretching.
   *
   * @param {number} columnVisualIndex Column visual index.
   * @returns {number}
   */
  #getWidthWithoutStretching(columnVisualIndex) {
    return this.#hot.getColWidth(columnVisualIndex, 'StretchColumns') ?? DEFAULT_COLUMN_WIDTH;
  }
}
