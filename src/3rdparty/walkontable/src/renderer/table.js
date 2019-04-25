export default class TableRenderer {
  constructor(rootNode, { cellRenderer } = {}) {
    this.rootNode = rootNode;
    // renderers
    this.rowHeaders = null;
    this.columnHeaders = null;
    this.colGroup = null;
    this.rows = null;
    this.cells = null;
    // filters
    this.rowFilter = null;
    this.columnFilter = null;
    // utils
    this.rowUtils = null;
    this.columnUtils = null;
    //
    this.rowsToRender = 0;
    this.columnsToRender = 0;
    this.rowHeaderFunctions = [];
    this.rowHeadersCount = 0;
    this.columnHeaderFunctions = [];
    this.columnHeadersCount = 0;

    this.totalRows = 0;
    this.totalColumn = 0;
    // options
    this.cellRenderer = cellRenderer;
  }

  setAxisUtils(rowUtils, columnUtils) {
    this.rowUtils = rowUtils;
    this.columnUtils = columnUtils;

    return this;
  }

  setSize(totalRows, totalColumn) {
    this.totalRows = totalRows;
    this.totalColumn = totalColumn;

    return this;
  }

  setViewportSize(rowsCount, columnsCount) {
    this.rowsToRender = rowsCount;
    this.columnsToRender = columnsCount;

    return this;
  }

  setFilters(rowFilter, columnFilter) {
    this.rowFilter = rowFilter;
    this.columnFilter = columnFilter;

    return this;
  }

  setHeaderContentRenderers(rowHeaders, columnHeaders) {
    this.rowHeaderFunctions = rowHeaders;
    this.rowHeadersCount = rowHeaders.length;
    this.columnHeaderFunctions = columnHeaders;
    this.columnHeadersCount = columnHeaders.length;

    return this;
  }

  setRenderers({ rowHeaders, columnHeaders, colGroup, rows, cells } = renderers) {
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

    return this;
  }

  renderedRowToSource(rowIndex) {
    return this.rowFilter.renderedToSource(rowIndex);
  }

  renderedColumnToSource(columnIndex) {
    return this.columnFilter.renderedToSource(columnIndex);
  }

  render() {
    this.colGroup.adjust();
    this.rowHeaders.adjust();
    this.columnHeaders.adjust();
    this.rows.adjust();

    this.colGroup.render();
    this.columnHeaders.render();
    this.rows.render();
    this.rowHeaders.render();
    this.cells.render();

    const { rowsToRender, rows } = this;

    // Fix for multi-line content and for supporting `rowHeights` option.
    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const TR = rows.getRenderedNode(visibleRowIndex);

      if (TR.firstChild) {
        const sourceRowIndex = this.renderedRowToSource(visibleRowIndex);
        const rowHeight = this.rowUtils.getHeight(sourceRowIndex);

        if (rowHeight) {
          // Decrease height. 1 pixel will be "replaced" by 1px border top
          TR.firstChild.style.height = `${rowHeight - 1}px`;
        } else {
          TR.firstChild.style.height = '';
        }
      }
    }
  }
}
