import { RowHeadersRenderer } from './rowHeaders';
import { ColumnHeadersRenderer } from './columnHeaders';
import { ColGroupRenderer } from './colGroup';
import { RowsRenderer } from './rows';
import { CellsRenderer } from './cells';
import { TableRenderer } from './table';

/**
 * Content renderer.
 *
 * @class Renderer
 */
class Renderer {
  constructor({ TABLE, THEAD, COLGROUP, TBODY, rowUtils, columnUtils, cellRenderer, stylesHandler } = {}) {
    /**
     * General renderer class used to render Walkontable content on screen.
     *
     * @type {TableRenderer}
     */
    this.renderer = new TableRenderer(TABLE, { cellRenderer, stylesHandler });
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
   * Sets the overlay that is currently rendered. If `null` is provided, the master overlay is set.
   *
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName The overlay name.
   * @returns {Renderer}
   */
  setActiveOverlayName(overlayName) {
    this.renderer.setActiveOverlayName(overlayName);

    return this;
  }

  /**
   * Sets filter calculators for newly calculated row and column position. The filters are used to transform visual
   * indexes (0 to N) to source indexes provided by Handsontable.
   *
   * @param {RowFilter} rowFilter The row filter instance.
   * @param {ColumnFilter} columnFilter The column filter instance.
   * @returns {Renderer}
   */
  setFilters(rowFilter, columnFilter) {
    this.renderer.setFilters(rowFilter, columnFilter);

    return this;
  }

  /**
   * Sets the viewport size of the rendered table.
   *
   * @param {number} rowsCount An amount of rows to render.
   * @param {number} columnsCount An amount of columns to render.
   * @returns {Renderer}
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
