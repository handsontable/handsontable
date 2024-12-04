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
export class TableRenderer {
  /**
   * Table element which will be used to render the children element.
   *
   * @type {HTMLTableElement}
   */
  rootNode;
  /**
   * Document owner of the root node.
   *
   * @type {HTMLDocument}
   */
  rootDocument;
  /**
   * Renderer class responsible for rendering row headers.
   *
   * @type {RowsRenderer}
   */
  rowHeaders = null;
  /**
   * Renderer class responsible for rendering column headers.
   *
   * @type {ColumnHeadersRenderer}
   */
  columnHeaders = null;
  /**
   * Renderer class responsible for rendering col in colgroup.
   *
   * @type {ColGroupRenderer}
   */
  colGroup = null;
  /**
   * Renderer class responsible for rendering rows in tbody.
   *
   * @type {RowsRenderer}
   */
  rows = null;
  /**
   * Renderer class responsible for rendering cells.
   *
   * @type {CellsRenderer}
   */
  cells = null;
  /**
   * Row filter which contains all necessary information about row index transformation.
   *
   * @type {RowFilter}
   */
  rowFilter = null;
  /**
   * Column filter which contains all necessary information about column index transformation.
   *
   * @type {ColumnFilter}
   */
  columnFilter = null;
  /**
   * Row utils class which contains all necessary information about sizes of the rows.
   *
   * @type {RowUtils}
   */
  rowUtils = null;
  /**
   * Column utils class which contains all necessary information about sizes of the columns.
   *
   * @type {ColumnUtils}
   */
  columnUtils = null;
  /**
   * Indicates how much rows should be rendered to fill whole table viewport.
   *
   * @type {number}
   */
  rowsToRender = 0;
  /**
   * Indicates how much columns should be rendered to fill whole table viewport.
   *
   * @type {number}
   */
  columnsToRender = 0;
  /**
   * An array of functions to be used as a content factory to row headers.
   *
   * @type {Function[]}
   */
  rowHeaderFunctions = [];
  /**
   * Count of the function used to render row headers.
   *
   * @type {number}
   */
  rowHeadersCount = 0;
  /**
   * An array of functions to be used as a content factory to column headers.
   *
   * @type {Function[]}
   */
  columnHeaderFunctions = [];
  /**
   * Count of the function used to render column headers.
   *
   * @type {number}
   */
  columnHeadersCount = 0;
  /**
   * Cell renderer used to render cells content.
   *
   * @type {Function}
   */
  cellRenderer;
  /**
   * Holds the name of the currently active overlay.
   *
   * @type {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'}
   */
  activeOverlayName;
  /**
   * Styles handler instance.
   */
  stylesHandler;

  constructor(rootNode, { cellRenderer, stylesHandler } = {}) {
    this.rootNode = rootNode;
    this.rootDocument = this.rootNode.ownerDocument;
    this.cellRenderer = cellRenderer;
    this.stylesHandler = stylesHandler;
  }

  /**
   * Sets the overlay that is currently rendered. If `null` is provided, the master overlay is set.
   *
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName The overlay name.
   */
  setActiveOverlayName(overlayName) {
    this.activeOverlayName = overlayName;
  }

  /**
   * Set row and column util classes.
   *
   * @param {RowUtils} rowUtils RowUtils instance which provides useful methods related to row sizes.
   * @param {ColumnUtils} columnUtils ColumnUtils instance which provides useful methods related to row sizes.
   */
  setAxisUtils(rowUtils, columnUtils) {
    this.rowUtils = rowUtils;
    this.columnUtils = columnUtils;
  }

  /**
   * Sets viewport size of the table.
   *
   * @param {number} rowsCount An amount of rows to render.
   * @param {number} columnsCount An amount of columns to render.
   */
  setViewportSize(rowsCount, columnsCount) {
    this.rowsToRender = rowsCount;
    this.columnsToRender = columnsCount;
  }

  /**
   * Sets row and column filter instances.
   *
   * @param {RowFilter} rowFilter Row filter instance which contains all necessary information about row index transformation.
   * @param {ColumnFilter} columnFilter Column filter instance which contains all necessary information about row
   * index transformation.
   */
  setFilters(rowFilter, columnFilter) {
    this.rowFilter = rowFilter;
    this.columnFilter = columnFilter;
  }

  /**
   * Sets row and column header functions.
   *
   * @param {Function[]} rowHeaders Row header functions. Factories for creating content for row headers.
   * @param {Function[]} columnHeaders Column header functions. Factories for creating content for column headers.
   */
  setHeaderContentRenderers(rowHeaders, columnHeaders) {
    this.rowHeaderFunctions = rowHeaders;
    this.rowHeadersCount = rowHeaders.length;
    this.columnHeaderFunctions = columnHeaders;
    this.columnHeadersCount = columnHeaders.length;
  }

  /**
   * Sets table renderers.
   *
   * @param {renderers} renderers The renderer units.
   * @param {RowHeadersRenderer} renderers.rowHeaders Row headers renderer.
   * @param {ColumnHeadersRenderer} renderers.columnHeaders Column headers renderer.
   * @param {ColGroupRenderer} renderers.colGroup Col group renderer.
   * @param {RowsRenderer} renderers.rows Rows renderer.
   * @param {CellsRenderer} renderers.cells Cells renderer.
   */
  setRenderers({ rowHeaders, columnHeaders, colGroup, rows, cells } = {}) {
    rowHeaders.setTable(this);
    columnHeaders.setTable(this);
    colGroup.setTable(this);
    rows.setTable(this);
    cells.setTable(this);

    this.rowHeaders = rowHeaders;
    this.columnHeaders = columnHeaders;
    this.colGroup = colGroup;
    this.rows = rows;
    this.cells = cells;
  }

  /**
   * Transforms visual/rendered row index to source index.
   *
   * @param {number} rowIndex Rendered index.
   * @returns {number}
   */
  renderedRowToSource(rowIndex) {
    return this.rowFilter.renderedToSource(rowIndex);
  }

  /**
   * Transforms visual/rendered column index to source index.
   *
   * @param {number} columnIndex Rendered index.
   * @returns {number}
   */
  renderedColumnToSource(columnIndex) {
    return this.columnFilter.renderedToSource(columnIndex);
  }

  /**
   * Returns `true` if the accessibility-related ARIA tags should be added to the table, `false` otherwise.
   *
   * @returns {boolean}
   */
  isAriaEnabled() {
    return this.rowUtils.wtSettings.getSetting('ariaTags');
  }

  /**
   * Renders the table.
   */
  render() {
    this.colGroup.adjust();
    this.columnHeaders.adjust();
    this.rows.adjust();
    this.rowHeaders.adjust();

    this.columnHeaders.render();
    this.rows.render();
    this.rowHeaders.render();
    this.cells.render();

    // After the cells are rendered calculate columns width to prepare proper values
    // for colGroup renderer (which renders COL elements).
    this.columnUtils.calculateWidths();
    this.colGroup.render();

    const { rowsToRender, rows } = this;

    // Fix for multi-line content and for supporting `rowHeights` option.
    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const TR = rows.getRenderedNode(visibleRowIndex);
      const rowUtils = this.rowUtils;

      if (TR.firstChild) {
        const sourceRowIndex = this.renderedRowToSource(visibleRowIndex);
        const rowHeight = rowUtils.getHeightByOverlayName(sourceRowIndex, this.activeOverlayName);
        const isBorderBoxSizing = this.stylesHandler.areCellsBorderBox();
        const borderCompensation = isBorderBoxSizing ? 0 : 1;

        if (rowHeight) {
          // Decrease height. 1 pixel will be "replaced" by 1px border top
          TR.firstChild.style.height = `${rowHeight - borderCompensation}px`;
        } else {
          TR.firstChild.style.height = '';
        }
      }
    }
  }
}
