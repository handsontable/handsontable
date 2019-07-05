import RowHeadersRenderer from './rowHeaders';
import ColumnHeadersRenderer from './columnHeaders';
import ColGroupRenderer from './colGroup';
import RowsRenderer from './rows';
import CellsRenderer from './cells';
import TableRenderer from './table';

/**
 * Content renderer.
 *
 * @class Renderer
 */
export default class Renderer {
  constructor(wot, wtTable) {
    /**
     * General renderer class used to render Walkontable content on screen.
     *
     * @type {TableRenderer}
     */
    this.renderer = new TableRenderer(wtTable.TABLE, {
      cellRenderer: wot.wtSettings.settings.cellRenderer,
    });
    this.renderer.setRenderers({
      rowHeaders: new RowHeadersRenderer(),
      columnHeaders: new ColumnHeadersRenderer(wtTable.THEAD),
      colGroup: new ColGroupRenderer(wtTable.COLGROUP),
      rows: new RowsRenderer(wtTable.TBODY),
      cells: new CellsRenderer(),
    });
    this.renderer.setAxisUtils(wtTable.rowUtils, wtTable.columnUtils);
  }

  /**
   * Sets filter calculators for newly calculated row and column position. The filters are used to transform visual
   * indexes (0 to N) to source indexes provided by Handsontable.
   *
   * @param {RowFilter} rowFilter
   * @param {ColumnFilter} columnFilter
   * @returns {Renderer}
   */
  setFilters(rowFilter, columnFilter) {
    this.renderer.setFilters(rowFilter, columnFilter);

    return this;
  }

  /**
   * Sets the viewport size of the rendered table.
   *
   * @param {Number} rowsCount An amount of rows to render.
   * @param {Number} columnsCount An amount of columns to render.
   * @return {Renderer}
   */
  setViewportSize(rowsCount, columnsCount) {
    this.renderer.setViewportSize(rowsCount, columnsCount);

    return this;
  }

  /**
   * Sets total size of the table.
   *
   * @param {Number} totalRows Total rows of the table.
   * @param {Number} totalColumns Total column of the table.
   * @returns {Renderer}
   */
  setTotalSize(totalRows, totalColumns) {
    this.renderer.setTotalSize(totalRows, totalColumns);

    return this;
  }

  /**
   * Sets row and column header functions.
   *
   * @param {Function[]} rowHeaders Row header functions. Factories for creating content for row headers.
   * @param {Function[]} columnHeaders Column header functions. Factories for creating content for column headers.
   * @returns {Renderer}
   */
  setHeaderContentRenderers(rowHeaders, columnHeaders) {
    this.renderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

    return this;
  }

  /**
   * Adjusts the table (preparing for render).
   */
  adjust() {
    this.renderer.adjust();
  }

  /**
   * Renders the table.
   */
  render() {
    this.renderer.render();
  }
}
