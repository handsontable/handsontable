import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';

export default class ColumnUtils {
  constructor(wot) {
    this.wot = wot;
    this.widths = new Map();
  }

  getWidth(sourceColumnIndex) {
    return this.widths.get(sourceColumnIndex);
  }

  calculateWidths() {
    const masterWot = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = masterWot.wtTable.holder;
    const defaultColumnWidth = this.wot.getSetting('defaultColumnWidth');
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0
    let rowHeaderWidthSetting = this.wot.getSetting('rowHeaderWidth');

    this.wot.wtViewport.columnsRenderCalculator.refreshStretching(this.wot.wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = this.wot.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      for (let i = 0; i < this.rowHeaderCount; i++) {
        const width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.widths.set(sourceColumnIndex - this.rowHeaderCount, width);
      }
    }

    const columnsToRender = this.wot.wtTable.getRenderedRowsCount();
    const columnFilter = this.wot.wtTable.columnFilter;

    for (let renderedColIndex = 0; renderedColIndex < columnsToRender; renderedColIndex++) {
      const sourceColumnIndex = columnFilter.renderedToSource(renderedColIndex);
      const width = this.wot.wtTable.getStretchedColumnWidth(sourceColumnIndex);

      this.widths.set(sourceColumnIndex, width);
    }
  }
}
