import from './rowHeaders';
import from './columnHeaderRows';
import from './columnHeaders';
import from './colGroup';
import from './rows';
import from './cells';
import from './table';
import type RowFilter from '../filter/row';
import type ColumnFilter from '../filter/column';
import type RowUtils from '../utils/row';
import type ColumnUtils from '../utils/column';
import type from '../types';

interface RendererOptions {
  TABLE?: HTMLTableElement;
  THEAD?: HTMLElement;
  COLGROUP?: HTMLElement;
  TBODY?: HTMLElement;
  rowUtils?: RowUtils;
  columnUtils?: ColumnUtils;
  cellRenderer?: Function;
  stylesHandler?: StylesHandler;
}

/**
 * Content renderer.
 *
 * @class Renderer
 */
class Renderer {
  /**
   * The underlying table renderer that orchestrates all sub-renderers.
   */
  declare renderer: TableRenderer;

  /**
   * @param options Configuration options for the renderer.
   */
  constructor({
    TABLE, THEAD, COLGROUP, TBODY, rowUtils, columnUtils, cellRenderer, stylesHandler
  }: RendererOptions = {}) {
    /**
     * General renderer class used to render Walkontable content on screen.
     *
     */
    this.renderer = new TableRenderer(TABLE!, { cellRenderer, stylesHandler });
    this.renderer.setRenderers({
      rowHeaders: new RowHeadersRenderer(),
      columnHeaderRows: new ColumnHeaderRowsRenderer(THEAD!),
      columnHeaders: new ColumnHeadersRenderer(),
      colGroup: new ColGroupRenderer(COLGROUP!),
      rows: new RowsRenderer(TBODY!),
      cells: new CellsRenderer(),
    });
    this.renderer.setAxisUtils(rowUtils!, columnUtils!);
  }

  /**
   * Sets the overlay that is currently rendered. If `null` is provided, the master overlay is set.
   *
   * @param overlayName The overlay name.
   * @returns 
   */
  setActiveOverlayName(overlayName: string) {
    this.renderer.setActiveOverlayName(overlayName);

    return this;
  }

  /**
   * Sets filter calculators for newly calculated row and column position. The filters are used to transform visual
   * indexes (0 to N) to source indexes provided by Handsontable.
   *
   * @param rowFilter The row filter instance.
   * @param columnFilter The column filter instance.
   * @returns 
   */
  setFilters(rowFilter: RowFilter, columnFilter: ColumnFilter) {
    this.renderer.setFilters(rowFilter, columnFilter);

    return this;
  }

  /**
   * Sets the viewport size of the rendered table.
   *
   * @param rowsCount An amount of rows to render.
   * @param columnsCount An amount of columns to render.
   * @returns 
   */
  setViewportSize(rowsCount: number, columnsCount: number) {
    this.renderer.setViewportSize(rowsCount, columnsCount);

    return this;
  }

  /**
   * Sets row and column header functions.
   *
   * @param rowHeaders Row header functions. Factories for creating content for row headers.
   * @param columnHeaders Column header functions. Factories for creating content for column headers.
   * @returns 
   */
  setHeaderContentRenderers(rowHeaders: Function[], columnHeaders: Function[]) {
    this.renderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

    return this;
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
  ColumnHeaderRowsRenderer,
  ColumnHeadersRenderer,
  ColGroupRenderer,
  RowsRenderer,
  CellsRenderer,
  TableRenderer,
  Renderer,
};
