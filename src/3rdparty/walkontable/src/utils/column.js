import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';

export default class ColumnUtils {
  constructor(wot) {
    this.wot = wot;
    this.widths = new Map();
    this.headerWidths = new Map();
  }

  getWidth(sourceColumnIndex) {
    return this.widths.get(sourceColumnIndex);
  }

  getHeaderWidth(sourceColumnIndex) {
    return this.headerWidths.get(sourceColumnIndex);
  }

  calculateWidths() {
    const { wot } = this;
    const masterWot = wot.cloneSource ? wot.cloneSource : wot;
    const mainHolder = masterWot.wtTable.holder;
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0
    let rowHeaderWidthSetting = wot.getSetting('rowHeaderWidth');

    wot.wtViewport.columnsRenderCalculator.refreshStretching(wot.wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = wot.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      const rowHeadersCount = wot.getSetting('rowHeaders').length;
      const defaultColumnWidth = wot.getSetting('defaultColumnWidth');

      for (let i = 0; i < rowHeadersCount; i++) {
        const width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.headerWidths.set(i, width);
      }
    }

    const columnsToRender = wot.wtTable.getRenderedColumnsCount();
    const columnFilter = wot.wtTable.columnFilter;

    for (let renderedColumnIndex = 0; renderedColumnIndex < columnsToRender; renderedColumnIndex++) {
      const sourceColumnIndex = columnFilter.renderedToSource(renderedColumnIndex);
      const width = wot.wtTable.getStretchedColumnWidth(sourceColumnIndex);

      this.widths.set(sourceColumnIndex, width);
    }
  }
}
