import RowHeadersRenderer from './rowHeaders';
import ColumnHeadersRenderer from './columnHeaders';
import ColGroupRenderer from './colGroup';
import RowsRenderer from './rows';
import CellsRenderer from './cells';
import TableRenderer from './table';

/**
 * @class TableRenderer
 */
export default class Renderer {
  /**
   * @param {WalkontableTable} wtTable
   */
  constructor(wot, wtTable) {
    this.table = new TableRenderer(wtTable.TABLE, {
      cellRenderer: wot.wtSettings.settings.cellRenderer,
    });
    this.table
      .setRenderers({
        rowHeaders: new RowHeadersRenderer(),
        columnHeaders: new ColumnHeadersRenderer(wtTable.THEAD),
        colGroup: new ColGroupRenderer(wtTable.COLGROUP),
        rows: new RowsRenderer(wtTable.TBODY),
        cells: new CellsRenderer(),
      })
      .setSize(wot.getSetting('totalRows'), wot.getSetting('totalColumns'))
      .setAxisUtils(wtTable.rowUtils, wtTable.columnUtils);
  }

  /**
   * Set filter calculators for newly calculated row and column position. The filters are used to transform visual
   * indexes (0 to N) to source indexes provided by Handsontable.
   *
   * @param {RowFilter} rowFilter
   * @param {ColumnFilter} columnFilter
   */
  setFilters(rowFilter, columnFilter) {
    this.table.setFilters(rowFilter, columnFilter);

    return this;
  }

  /**
   * Set the viewport size of the rendered table.
   *
   * @param {Number} rowsCount An amount of rows to render.
   * @param {Number} columnsCount An amount of columns to render.
   */
  setViewportSize(rowsCount, columnsCount) {
    this.table.setViewportSize(rowsCount, columnsCount);

    return this;
  }

  setHeaderContentRenderers(rowHeaders, columnHeaders) {
    this.table.setHeaderContentRenderers(rowHeaders, columnHeaders);

    return this;
  }

  adjust() {
    this.table.adjust();
  }

  render() {
    this.table.render();
  }
}
