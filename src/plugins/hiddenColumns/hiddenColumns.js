import BasePlugin from './../_base.js';
import * as dom from './../../dom.js';
import {registerPlugin, getPlugin} from './../../plugins.js';

/**
 * @class HiddenColumns
 * @plugin HiddenColumns
 */
class HiddenColumns extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().hiddenColumns) {
      return;
    }

    this.settings = null;
    this.hiddenColumns = [];
    this.init();
  }


  init() {
    this.settings = this.hot.getSettings().hiddenColumns;
    if (this.settings.copyPasteEnabled === void 0) {
      this.settings.copyPasteEnabled = true;
    }

    this.bindHooks();
  }

  bindHooks() {
    this.hot.addHook('beforeInit', () => this.onBeforeInit());
    //this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterGetCellMeta', (row, col, cellProperties) => this.onAfterGetCellMeta(row, col, cellProperties));
    this.hot.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.hot.addHook('modifyCopyableColumnRange', (ranges) => this.onmodifyCopyableColumnRange(ranges));
    this.hot.addHook('afterGetColHeader', (col, TH) => this.getColHeader(col, TH));
  }

  onBeforeInit() {
    this.hideColumns(this.settings.columns);
  }

  //onAfterInit() {
  //  if (this.settings.indicators === true) {
  //    this.setIndicators();
  //  }
  //}

  onmodifyCopyableColumnRange(ranges) {
    if(this.settings.copyPasteEnabled) {
      return ranges;
    }

    let newRanges = [];

    for (let i = 0, rangeCount = ranges.length; i < rangeCount; i++) {
      let partial = this.splitCopyableRange(ranges[i]);

      for(var j = 0; j < partial.length; j++) {
        newRanges.push(partial[j]);
      }
    }

    return newRanges;
  }

  splitCopyableRange(range) {
    let splitRanges = [];
    let newStart = range.startCol;
    let isHidden = (i) => (this.hiddenColumns[i]);

    for (let i = range.startCol; i <= range.endCol + 1; i++) {

      if (isHidden(i) && i !== range.startCol) {

        if (isHidden(i - 1)) {
          continue;
        }

        splitRanges.push({
          startRow: range.startRow,
          endRow: range.endRow,
          startCol: Math.max(range.startCol, newStart),
          endCol: i - 1
        });

      } else if (isHidden(i - 1)) {
        newStart = i;
      }

      if (!isHidden(i) && i === range.endCol) {
        splitRanges.push({
          startRow: range.startRow,
          endRow: range.endRow,
          startCol: Math.max(range.startCol, newStart),
          endCol: i
        });
      }

    }

    return splitRanges;
  }

  getColHeader(col, TH) {
    if (!this.settings.indicators || this.hiddenColumns[col]) {
      return;
    }

    if (this.hiddenColumns[col - 1]) {
      dom.addClass(TH, 'afterHiddenColumn');
    }
    if (this.hiddenColumns[col + 1]) {
      dom.addClass(TH, 'beforeHiddenColumn');
    }

    //let headerLink = TH.querySelector('.colHeader');
    //
    //if (this.hot.getSettings().columnSorting && col >= 0) {
    //  dom.addClass(headerLink, 'columnSorting');
    //}
    //dom.removeClass(headerLink, 'descending');
    //dom.removeClass(headerLink, 'ascending');
    //
    //if (this.sortIndicators[col]) {
    //  if (col === this.hot.sortColumn) {
    //    if (this.sortOrderClass === 'ascending') {
    //      dom.addClass(headerLink, 'ascending');
    //
    //    } else if (this.sortOrderClass === 'descending') {
    //      dom.addClass(headerLink, 'descending');
    //    }
    //  }
    //}
  }

  hideColumns(elements) {
    for (let i = 0, elemCount = elements.length; i < elemCount; i++) {
      if (typeof elements[i] === 'number') {
        this.hiddenColumns[elements[i]] = true;

      } else if (typeof elements[i] === 'object') {
        hideColumns(elements[i]);
      }
    }
  }

  onAfterGetCellMeta(row, col, cellProperties) {
    if (this.settings.copyPasteEnabled === false && this.hiddenColumns[col]) {
      cellProperties.copyable = false;
      cellProperties.skipColumnOnPaste = true;
    }
  }

  onModifyColWidth(width, col) {
    if (this.hiddenColumns[col]) {
      return 0;
    } else if (this.settings.indicators && (this.hiddenColumns[col + 1] || this.hiddenColumns[col - 1])) {

      // add additional space for hidden column indicator
      return width + 15;
    }
  }

}

export {HiddenColumns};

registerPlugin('hiddenColumns', HiddenColumns);

Handsontable.plugins.HiddenColumns = HiddenColumns;