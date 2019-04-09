export default class TableRenderer {
  constructor(rootNode, { isClone = false, totalRows = 0, cellRenderer = (() => {}) } = {}) {
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
    //
    this.rowsToRender = 0;
    this.columnsToRender = 0;
    this.rowHeaderFunctions = [];
    this.rowHeadersCount = 0;
    this.columnHeaderFunctions = [];
    this.columnHeadersCount = 0;
    // options
    this.isClone = isClone;
    this.totalRows = totalRows;
    this.cellRenderer = cellRenderer;
  }

  setSize(rowsCount, columnsCount) {
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
  }

  refresh() {
    this.colGroup.refresh();
    this.columnHeaders.refresh();
    this.rows.refresh();
    this.rowHeaders.refresh();
    this.cells.refresh();
  }
}
