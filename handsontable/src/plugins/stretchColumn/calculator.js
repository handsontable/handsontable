import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import {
  getScrollbarWidth,
} from '../../helpers/dom/element';
import { StretchAllStrategy } from './strategies/all';

const STRETCH_WIDTH_MAP_NAME = 'stretchColumn';

export class StretchCalculator {
  #hot;
  /**
   * @type {IndexToValueMap}
   */
  #widthsMap;
  #stretchStrategies = new Map([
    ['all', new StretchAllStrategy()],
    // ['last', new StretchLastMode()],
    // ['none', new StretchNoneMode()],
  ]);
  #activeMode = 'all';

  constructor(hotInstance) {
    this.#hot = hotInstance;
    this.#widthsMap = this.#hot.columnIndexMapper
      .createAndRegisterIndexMap(STRETCH_WIDTH_MAP_NAME, 'physicalIndexToValue');
  }

  /**
   * Recalculate columns stretching.
   */
  refreshStretching() {
    // const scrollbarCompensation = this.#hot.view.hasHorizontalScroll() ? getScrollbarWidth() : 0;
    const scrollbarCompensation = 0;

    let allColumnsWidth = 0;
    let viewportWidth = this.#hot.view.getViewportWidth() + scrollbarCompensation;
    const fixedColumns = [];
    const nonFixedColumns = [];

    for (let columnIndex = 0; columnIndex < this.#hot.countCols(); columnIndex++) {
      const columnWidth = this.#hot.getColWidth(columnIndex) ?? DEFAULT_COLUMN_WIDTH;
      const fixedWidth = this.#hot.runHooks('beforeStretchingColumnWidth', undefined, columnIndex);

      console.log('columnIndex:', columnIndex, 'columnWidth:', columnWidth, 'fixedWidth:', fixedWidth);

      if (typeof fixedWidth === 'number') {
        viewportWidth -= fixedWidth;
        fixedColumns.push(columnIndex);

      } else {
        allColumnsWidth += columnWidth;
        nonFixedColumns.push(columnIndex);
      }
    }

    this.#hot.batchExecution(() => {
      fixedColumns.forEach((columnIndex) => {
        this.#widthsMap.setValueAtIndex(this.#hot.toPhysicalColumn(columnIndex), null);
      });
    }, true);

    const stretchStrategy = this.#stretchStrategies.get(this.#activeMode);

    stretchStrategy.prepare({
      allColumnsWidth,
      viewportWidth,
    });

    nonFixedColumns.forEach((columnIndex) => {
      console.log('columnIndex:', columnIndex, 'columnWidth:', this.#hot.getColWidth(columnIndex) ?? DEFAULT_COLUMN_WIDTH);
      stretchStrategy.calculate(columnIndex, this.#hot.getColWidth(columnIndex) ?? DEFAULT_COLUMN_WIDTH);
    });

    stretchStrategy.finish();

    this.#hot.batchExecution(() => {
      stretchStrategy.getWidths().forEach(([columnIndex, width]) => {
        this.#widthsMap.setValueAtIndex(this.#hot.toPhysicalColumn(columnIndex), width);
      });
    }, true);
  }

  getColumnWidth(columnVisualIndex) {
    return this.#widthsMap.getValueAtIndex(this.#hot.toPhysicalColumn(columnVisualIndex));
  }

  destroy() {

  }
}
