import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';

export default class ColumnUtils {
  constructor(wot) {
    this.wot = wot;
    this.headerWidths = new Map();
  }

  getWidth(sourceColumnIndex) {
    let width = this.wot.wtSettings.settings.columnWidth;

    if (typeof width === 'function') {
      width = width(sourceColumnIndex);

    } else if (typeof width === 'object') {
      width = width[sourceColumnIndex];
    }

    return width || this.wot.wtSettings.settings.defaultColumnWidth;
  }

  getStretchedColumnWidth(sourceColumnIndex) {
    const columnWidth = this.getWidth(sourceColumnIndex);
    const calculator = this.wot.wtViewport.columnsRenderCalculator;
    let width = (columnWidth === null || columnWidth === void 0) ? this.wot.wtSettings.settings.defaultColumnWidth : columnWidth;

    if (calculator) {
      const stretchedWidth = calculator.getStretchedColumnWidth(sourceColumnIndex, width);

      if (stretchedWidth) {
        width = stretchedWidth;
      }
    }

    return width;
  }

  getHeaderHeight(level) {
    let height = this.wot.wtSettings.settings.defaultRowHeight;
    const oversizedHeight = this.wot.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== void 0) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  getHeaderWidth(sourceColumnIndex) {
    return this.headerWidths.get(this.wot.wtTable.columnFilter.sourceToRendered(sourceColumnIndex));
  }

  calculateWidths() {
    const { wot } = this;
    const { wtTable, wtViewport, cloneSource } = wot;
    const mainHolder = cloneSource ? cloneSource.wtTable.holder : wtTable.holder;
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0
    let rowHeaderWidthSetting = wot.getSetting('rowHeaderWidth');

    wtViewport.columnsRenderCalculator.refreshStretching(wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = wot.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      const rowHeadersCount = wot.getSetting('rowHeaders').length;
      const defaultColumnWidth = wot.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        const width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
