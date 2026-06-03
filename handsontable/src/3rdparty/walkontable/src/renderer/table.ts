import type from './rowHeaders';
import type from './columnHeaderRows';
import type from './columnHeaders';
import type from './colGroup';
import type from './rows';
import type from './cells';
import type RowFilter from '../filter/row';
import type ColumnFilter from '../filter/column';
import type RowUtils from '../utils/row';
import type ColumnUtils from '../utils/column';
import type from '../types';

/**
 * TableRenderer class collects all renderers and properties necessary for table creation. It's
 * responsible for adjusting and rendering each renderer.
 *
 * Below is a diagram of the renderers together with an indication of what they are responisble for.
 *   <table>
 *     <colgroup>  \ (root node)
 *       <col>      \
 *       <col>       \___ ColGroupRenderer
 *       <col>       /
 *       <col>      /
 *     </colgroup> /
 *     <thead>     \ (root node)
 *       <tr>       --- ColumnHeaderRowsRenderer
 *         <th>      \
 *         <th>       \__ ColumnHeadersRenderer
 *         <th>       /
 *         <th>      /
 *       </tr>      /
 *     </thead>    /
 *     <tbody>   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\ (root node)
 *       <tr>   (root node)          \
 *         <th>  --- RowHeadersRenderer
 *         <td>  \                     \
 *         <td>   -- CellsRenderer      \
 *         <td>  /                       \
 *       </tr>                            \
 *       <tr>   (root node)                \
 *         <th>  --- RowHeadersRenderer     \
 *         <td>  \                           \___ RowsRenderer
 *         <td>   -- CellsRenderer           /
 *         <td>  /                          /
 *       </tr>                             /
 *       <tr>   (root node)               /
 *         <th>  --- RowHeadersRenderer  /
 *         <td>  \                      /
 *         <td>   -- CellsRenderer     /
 *         <td>  /                    /
 *       </tr>                       /
 *     </tbody>  ___________________/
 *   </table>.
 *
 * @class {RowsRenderer}
 */
export class TableRenderer {
  /**
   * Table element which will be used to render the children element.
   *
   */
  declare rootNode: HTMLTableElement;
  /**
   * Document owner of the root node.
   *
   */
  declare rootDocument: Document;
  /**
   * Renderer class responsible for rendering row headers.
   *
   */
  rowHeaders: RowHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering column header rows (TR elements in THEAD).
   *
   */
  columnHeaderRows: ColumnHeaderRowsRenderer | null = null;
  /**
   * Renderer class responsible for rendering column headers (TH elements in TR).
   *
   */
  columnHeaders: ColumnHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering col in colgroup.
   *
   */
  colGroup: ColGroupRenderer | null = null;
  /**
   * Renderer class responsible for rendering rows in tbody.
   *
   */
  rows: RowsRenderer | null = null;
  /**
   * Renderer class responsible for rendering cells.
   *
   */
  cells: CellsRenderer | null = null;
  /**
   * Row filter which contains all necessary information about row index transformation.
   *
   */
  rowFilter: RowFilter | null = null;
  /**
   * Column filter which contains all necessary information about column index transformation.
   *
   */
  columnFilter: ColumnFilter | null = null;
  /**
   * Row utils class which contains all necessary information about sizes of the rows.
   *
   */
  rowUtils: RowUtils | null = null;
  /**
   * Column utils class which contains all necessary information about sizes of the columns.
   *
   */
  columnUtils: ColumnUtils | null = null;
  /**
   * Indicates how much rows should be rendered to fill whole table viewport.
   *
   */
  rowsToRender: number = 0;
  /**
   * Indicates how much columns should be rendered to fill whole table viewport.
   *
   */
  columnsToRender: number = 0;
  /**
   * An array of functions to be used as a content factory to row headers.
   *
   */
  rowHeaderFunctions: Function[] = [];
  /**
   * Count of the function used to render row headers.
   *
   */
  rowHeadersCount: number = 0;
  /**
   * An array of functions to be used as a content factory to column headers.
   *
   */
  columnHeaderFunctions: Function[] = [];
  /**
   * Count of the function used to render column headers.
   *
   */
  columnHeadersCount: number = 0;
  /**
   * Cell renderer used to render cells content.
   *
   */
  declare cellRenderer: Function;
  /**
   * Holds the name of the currently active overlay.
   *
   */
  declare activeOverlayName: string;
  /**
   * Styles handler instance.
   */
  declare stylesHandler: StylesHandler;

  /**
   * @param rootNode The root TABLE element that this renderer manages.
   * @param options Optional configuration including the cell renderer function and the styles handler instance.
   */
  constructor(
    rootNode: HTMLTableElement,
    { cellRenderer, stylesHandler }: = {}) {
    this.rootNode = rootNode;
    this.rootDocument = this.rootNode.ownerDocument;
    this.cellRenderer = cellRenderer!;
    this.stylesHandler = stylesHandler!;
  }

  /**
   * Sets the overlay that is currently rendered. If `null` is provided, the master overlay is set.
   *
   * @param overlayName The overlay name.
   */
  setActiveOverlayName(overlayName: string) {
    this.activeOverlayName = overlayName;
  }

  /**
   * Set row and column util classes.
   *
   * @param rowUtils RowUtils instance which provides useful methods related to row sizes.
   * @param columnUtils ColumnUtils instance which provides useful methods related to row sizes.
   */
  setAxisUtils(rowUtils: RowUtils, columnUtils: ColumnUtils) {
    this.rowUtils = rowUtils;
    this.columnUtils = columnUtils;
  }

  /**
   * Sets viewport size of the table.
   *
   * @param rowsCount An amount of rows to render.
   * @param columnsCount An amount of columns to render.
   */
  setViewportSize(rowsCount: number, columnsCount: number) {
    this.rowsToRender = rowsCount;
    this.columnsToRender = columnsCount;
  }

  /**
   * Sets row and column filter instances.
   *
   * @param rowFilter Row filter instance which contains all necessary information about row index transformation.
   * @param columnFilter Column filter instance which contains all necessary information about row
   * index transformation.
   */
  setFilters(rowFilter: RowFilter, columnFilter: ColumnFilter) {
    this.rowFilter = rowFilter;
    this.columnFilter = columnFilter;
  }

  /**
   * Sets row and column header functions.
   *
   * @param rowHeaders Row header functions. Factories for creating content for row headers.
   * @param columnHeaders Column header functions. Factories for creating content for column headers.
   */
  setHeaderContentRenderers(rowHeaders: Function[], columnHeaders: Function[]) {
    this.rowHeaderFunctions = rowHeaders;
    this.rowHeadersCount = rowHeaders.length;
    this.columnHeaderFunctions = columnHeaders;
    this.columnHeadersCount = columnHeaders.length;
  }

  /**
   * Sets table renderers.
   *
   * @param renderers The renderer units.
   * @param renderers.rowHeaders Row headers renderer.
   * @param renderers.columnHeaderRows Column header rows renderer.
   * @param renderers.columnHeaders Column headers renderer.
   * @param renderers.colGroup Col group renderer.
   * @param renderers.rows Rows renderer.
   * @param renderers.cells Cells renderer.
   */
  setRenderers({ rowHeaders, columnHeaderRows, columnHeaders, colGroup, rows, cells }: {
    rowHeaders: RowHeadersRenderer;
    columnHeaderRows: ColumnHeaderRowsRenderer;
    columnHeaders: ColumnHeadersRenderer;
    colGroup: ColGroupRenderer;
    rows: RowsRenderer;
    cells: CellsRenderer;
  }) {
    rowHeaders.setTable(this);
    columnHeaderRows.setTable(this);
    columnHeaders.setTable(this);
    colGroup.setTable(this);
    rows.setTable(this);
    cells.setTable(this);

    this.rowHeaders = rowHeaders;
    this.columnHeaderRows = columnHeaderRows;
    this.columnHeaders = columnHeaders;
    this.colGroup = colGroup;
    this.rows = rows;
    this.cells = cells;
  }

  /**
   * Transforms visual/rendered row index to source index.
   *
   * @param rowIndex Rendered index.
   * @returns 
   */
  renderedRowToSource(rowIndex: number) {
    return this.rowFilter!.renderedToSource(rowIndex);
  }

  /**
   * Transforms visual/rendered column index to source index.
   *
   * @param columnIndex Rendered index.
   * @returns 
   */
  renderedColumnToSource(columnIndex: number) {
    return this.columnFilter!.renderedToSource(columnIndex);
  }

  /**
   * Returns `true` if the accessibility-related ARIA tags should be added to the table, `false` otherwise.
   *
   * @returns 
   */
  isAriaEnabled() {
    return this.rowUtils!.wtSettings.getSetting<boolean>('ariaTags');
  }

  /**
   * Renders the table.
   */
  render() {
    this.columnHeaderRows!.render();
    this.columnHeaders!.render();
    this.rows!.render();
    this.rowHeaders!.render();
    this.cells!.render();

    // After the cells are rendered calculate columns width to prepare proper values
    // for colGroup renderer (which renders COL elements).
    this.columnUtils!.calculateWidths();
    this.colGroup!.render();

    const = this;

    // Fix for multi-line content and for supporting `rowHeights` option.
    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const TR = rows!.getRenderedNode(visibleRowIndex);
      const rowUtils = this.rowUtils;

      if (TR && TR.firstChild) {
        const sourceRowIndex = this.renderedRowToSource(visibleRowIndex);
        const rowHeight = rowUtils!.getHeightByOverlayName(sourceRowIndex, this.activeOverlayName);
        const isBorderBoxSizing = this.stylesHandler.areCellsBorderBox();
        const borderCompensation = isBorderBoxSizing ? 0 : 1;

        if (rowHeight) {
          // Decrease height. 1 pixel will be "replaced" by 1px border top
          (TR.firstChild as HTMLElement).style.height = `${rowHeight - borderCompensation}px`;
        } else {
          (TR.firstChild as HTMLElement).style.height = '';
        }
      }
    }
  }
}
