import {
  addClass,
  empty,
  getScrollbarWidth,
  hasClass,
  innerHeight,
  outerWidth,
  // fastInnerHTML,
} from './../../../../helpers/dom/element';
import RowHeadersRenderer from './rowHeaders';
import ColumnHeadersRenderer from './columnHeaders';
import ColGroupRenderer from './colGroup';
import RowsRenderer from './rows';
import CellsRenderer from './cells';
import TableRenderer from './table';

// TODO: After moving class to one instance check if this warning works!
let performanceWarningAppeared = false;

/**
 * @class TableRenderer
 */
export default class Renderer {
  /**
   * @param {WalkontableTable} wtTable
   */
  constructor(wot, wtTable) {
    this.wot = wot;
    this.wtTable = wtTable;
    this.table = new TableRenderer(wtTable.TABLE, {
      markAsClone: this.wot.isClone(),
      totalRows: this.wot.getSetting('totalRows'),
      cellRenderer: this.wot.wtSettings.settings.cellRenderer,
    });
    this.table.setRenderers({
      rowHeaders: new RowHeadersRenderer(),
      columnHeaders: new ColumnHeadersRenderer(wtTable.THEAD),
      colGroup: new ColGroupRenderer(wtTable.COLGROUP, (width) => wtTable.columnUtils.getWidth(width)),
      rows: new RowsRenderer(wtTable.TBODY),
      cells: new CellsRenderer(),
    })
  }

  /**
   * Set filter calculators for newly calculated row and column position. The filters are used to transform visual
   * indexes (0 to N) to source indexes provided by Handsontable.
   *
   * @param {[type]} rowFilter
   * @param {[type]} columnFilter
   */
  setFilters(rowFilter, columnFilter) {
    this.table.setFilters(rowFilter, columnFilter);

    return this;
  }

  /**
   * Set the target size of the rendered table.
   *
   * @param {Number} rowsCount An amount of rows to render.
   * @param {Number} columnsCount An amount of columns to render.
   */
  setSize(rowsCount, columnsCount) {
    this.table.setSize(rowsCount, columnsCount);

    return this;
  }

  setHeaderContentRenderers(rowHeaders, columnsHeaders) {
    this.table.setHeaderContentRenderers(rowHeaders, columnsHeaders);

    return this;
  }

  render() {
    this.table.render();
  }

  refresh() {
    this.table.refresh();
  }
}
