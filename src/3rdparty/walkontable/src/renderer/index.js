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
class Renderer {
  constructor({ TABLE, THEAD, COLGROUP, TBODY, rowUtils, columnUtils, cellRenderer } = {}) {
    /**
     * General renderer class used to render Walkontable content on screen.
     *
     * @type {TableRenderer}
     */
    this.renderer = new TableRenderer(TABLE, { cellRenderer });
    this.renderer.setRenderers({
      rowHeaders: new RowHeadersRenderer(),
      columnHeaders: new ColumnHeadersRenderer(THEAD),
      colGroup: new ColGroupRenderer(COLGROUP),
      rows: new RowsRenderer(TBODY),
      cells: new CellsRenderer(),
    });
    this.renderer.setAxisUtils(rowUtils, columnUtils);
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

export {
  RowHeadersRenderer,
  ColumnHeadersRenderer,
  ColGroupRenderer,
  RowsRenderer,
  CellsRenderer,
  TableRenderer,
  Renderer,
};
