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
 *       <tr>       \
 *         <th>      \
 *         <th>       \____ ColumnHeadersRenderer
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

import ColumnFilter from '../filter/column';
import RowFilter from '../filter/row';
import ColumnUtils from '../utils/column';
import RowUtils from '../utils/row';
import { TableRendererInterface, TableRendererOptions } from './interfaces';
import { CellsRenderer } from './cells';
import { RowsRenderer } from './rows';
import { ColumnHeadersRenderer } from './columnHeaders';
import { RowHeadersRenderer } from './rowHeaders';
import { ColGroupRenderer } from './colGroup';

export class TableRenderer implements TableRendererInterface {
  /**
   * Table element which will be used to render the children element.
   *
   * @type {HTMLTableElement}
   */
  rootNode: HTMLTableElement;
  /**
   * Document owner of the root node.
   *
   * @type {HTMLDocument}
   */
  rootDocument: Document;
  /**
   * Renderer class responsible for rendering row headers.
   *
   * @type {RowsRenderer}
   */
  rowHeaders: RowHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering column headers.
   *
   * @type {ColumnHeadersRenderer}
   */
  columnHeaders: ColumnHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering col in colgroup.
   *
   * @type {ColGroupRenderer}
   */
  colGroup: ColGroupRenderer | null = null;
  /**
   * Renderer class responsible for rendering rows in tbody.
   *
   * @type {RowsRenderer}
   */
  rows: RowsRenderer | null = null;
  /**
   * Renderer class responsible for rendering cells.
   *
   * @type {CellsRenderer}
   */
  cells: CellsRenderer | null = null;
  /**
   * Row filter which contains all necessary information about row index transformation.
   *
   * @type {RowFilter}
   */
  rowFilter: RowFilter;
  /**
   * Column filter which contains all necessary information about column index transformation.
   *
   * @type {ColumnFilter}
   */
  columnFilter: ColumnFilter;
  /**
   * Row utils class which contains all necessary information about sizes of the rows.
   *
   * @type {RowUtils}
   */
  rowUtils: RowUtils;
  /**
   * Column utils class which contains all necessary information about sizes of the columns.
   *
   * @type {ColumnUtils}
   */
  columnUtils: ColumnUtils;
  /**
   * The number of rows to render.
   *
   * @type {number}
   */
  rowsToRender: number = 0;
  /**
   * The number of columns to render.
   *
   * @type {number}
   */
  columnsToRender: number = 0;
  /**
   * Row header functions accepting row number as argument and returning string content for headers.
   *
   * @type {Function[]}
   */
  rowHeaderFunctions: Array<Function> = [];
  /**
   * Column header functions accepting column number as argument and returning string content for headers.
   *
   * @type {Function[]}
   */
  columnHeaderFunctions: Array<Function> = [];
  /**
   * The number of row headers.
   *
   * @type {number}
   */
  rowHeadersCount: number = 0;
  /**
   * The number of column headers.
   *
   * @type {number}
   */
  columnHeadersCount: number = 0;
  /**
   * Function responsible for rendering cells content.
   *
   * @type {Function}
   */
  cellRenderer: Function;
  /**
   * The active overlay type name.
   *
   * @type {string}
   */
  activeOverlayName: string;
  /**
   * Styles handler.
   */
  stylesHandler: any;

  constructor(rootNode: HTMLTableElement, { cellRenderer, stylesHandler }: TableRendererOptions = {}) {
    this.rootNode = rootNode;
    this.rootDocument = this.rootNode.ownerDocument;

    this.cellRenderer = cellRenderer as Function;
    this.stylesHandler = stylesHandler;
  }

  /**
   * Set active overlay type name.
   *
   * @param {string} name Overlay type name.
   */
  setActiveOverlayName(name: string): void {
    this.activeOverlayName = name;
  }

  /**
   * Set row and column util classes.
   *
   * @param {RowUtils} rowUtils Rowutils class reference.
   * @param {ColumnUtils} columnUtils Column utils class reference.
   */
  setAxisUtils(rowUtils: RowUtils, columnUtils: ColumnUtils): void {
    this.rowUtils = rowUtils;
    this.columnUtils = columnUtils;
  }

  /**
   * Set the viewport size of the table.
   *
   * @param {number} rowsCount The table rows count.
   * @param {number} columnsCount The table columns count.
   */
  setViewportSize(rowsCount: number, columnsCount: number): void {
    this.rowsToRender = rowsCount;
    this.columnsToRender = columnsCount;
  }

  /**
   * Set the filter instances.
   *
   * @param {RowFilter} rowFilter The row filter instance.
   * @param {ColumnFilter} columnFilter The column filter instance.
   */
  setFilters(rowFilter: RowFilter, columnFilter: ColumnFilter): void {
    this.rowFilter = rowFilter;
    this.columnFilter = columnFilter;
  }

  /**
   * Set header functions for row and column headers.
   *
   * @param {Function[]} rowHeaders Row header functions.
   * @param {Function[]} columnHeaders Column header functions.
   */
  setHeaderContentRenderers(rowHeaders: Function[], columnHeaders: Function[]): void {
    this.rowHeaderFunctions = rowHeaders || [];
    this.rowHeadersCount = this.rowHeaderFunctions.length;

    this.columnHeaderFunctions = columnHeaders || [];
    this.columnHeadersCount = this.columnHeaderFunctions.length;
  }

  /**
   * Set all required renderers for table generation.
   *
   * @param {object} renderers The object which describes the renderers configuration.
   */
  setRenderers({ rowHeaders, columnHeaders, colGroup, rows, cells }: {
    rowHeaders?: RowHeadersRenderer,
    columnHeaders?: ColumnHeadersRenderer,
    colGroup?: ColGroupRenderer,
    rows?: RowsRenderer,
    cells?: CellsRenderer
  } = {}): void {
    if (rowHeaders) {
      this.rowHeaders = rowHeaders;
      this.rowHeaders.setTable(this);
    }
    if (columnHeaders) {
      this.columnHeaders = columnHeaders;
      this.columnHeaders.setTable(this);
    }
    if (colGroup) {
      this.colGroup = colGroup;
      this.colGroup.setTable(this);
    }
    if (rows) {
      this.rows = rows;
      this.rows.setTable(this);
    }
    if (cells) {
      this.cells = cells;
      this.cells.setTable(this);
    }
  }

  /**
   * Get rendered row at specific index.
   *
   * @param {number} rowIndex Row's visual index.
   * @returns {number}
   */
  renderedRowToSource(rowIndex: number): number {
    return this.rowFilter.renderedToSource(rowIndex);
  }

  /**
   * Get rendered column at specific index.
   *
   * @param {number} columnIndex Column's visual index.
   * @returns {number}
   */
  renderedColumnToSource(columnIndex: number): number {
    return this.columnFilter.renderedToSource(columnIndex);
  }

  /**
   * Returns boolean information if ARIA attributes should be added.
   *
   * @returns {boolean}
   */
  isAriaEnabled(): boolean {
    return !!this.stylesHandler?.isAriaEnabled?.(this.activeOverlayName);
  }

  /**
   * Adjust all necessary renderers.
   */
  adjust(): void {
    if (this.columnHeaders) {
      this.columnHeaders.adjust();
    }
    if (this.rowHeaders) {
      this.rowHeaders.adjust();
    }
    if (this.cells) {
      this.cells.adjust();
    }
    if (this.rows) {
      this.rows.adjust();
    }
    if (this.colGroup) {
      this.colGroup.adjust();
    }
  }

  /**
   * Renders the table.
   */
  render(): void {
    if (this.colGroup) {
      this.colGroup.render();
    }
    if (this.columnHeaders) {
      this.columnHeaders.render();
    }

    if (this.rows) {
      this.rows.render();
    }
  }
}
