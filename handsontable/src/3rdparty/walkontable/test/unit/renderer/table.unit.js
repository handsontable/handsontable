import TableRenderer from 'walkontable/renderer/table';

function createRenderer() {
  const rootNode = document.createElement('table');
  const cellRenderer = function() {};
  const renderer = new TableRenderer(rootNode, { cellRenderer });

  return { renderer, rootNode, cellRenderer };
}

describe('TableRenderer', () => {
  it('should be correctly setup', () => {
    const { renderer, rootNode, cellRenderer } = createRenderer();

    expect(renderer.rootNode).toBe(rootNode);
    expect(renderer.rootDocument).toBe(rootNode.ownerDocument);
    expect(renderer.rowHeaders).toBe(null);
    expect(renderer.columnHeaders).toBe(null);
    expect(renderer.colGroup).toBe(null);
    expect(renderer.rows).toBe(null);
    expect(renderer.cells).toBe(null);
    expect(renderer.rowFilter).toBe(null);
    expect(renderer.columnFilter).toBe(null);
    expect(renderer.rowUtils).toBe(null);
    expect(renderer.columnUtils).toBe(null);
    expect(renderer.rowsToRender).toBe(0);
    expect(renderer.columnsToRender).toBe(0);
    expect(renderer.rowHeaderFunctions).toEqual([]);
    expect(renderer.rowHeadersCount).toBe(0);
    expect(renderer.columnHeaderFunctions).toEqual([]);
    expect(renderer.cellRenderer).toBe(cellRenderer);
  });

  it('should set `rowUtils` and `columnUtils` properties after calling `setAxisUtils` method', () => {
    const { renderer } = createRenderer();

    const rowUtils = new (class RowUtils {})();
    const columnUtils = new (class ColumnUtils {})();

    renderer.setAxisUtils(rowUtils, columnUtils);

    expect(renderer.rowUtils).toBe(rowUtils);
    expect(renderer.columnUtils).toBe(columnUtils);
  });

  it('should set `rowsToRender` and `columnsToRender` properties after calling `setViewportSize` method', () => {
    const { renderer } = createRenderer();

    renderer.setViewportSize(10, 20);

    expect(renderer.rowsToRender).toBe(10);
    expect(renderer.columnsToRender).toBe(20);
  });

  it('should set `rowFilter` and `columnFilter` properties after calling `setFilters` method', () => {
    const { renderer } = createRenderer();

    const rowFilter = new (class RowFilter {})();
    const columnFilter = new (class ColumnFilter {})();

    renderer.setFilters(rowFilter, columnFilter);

    expect(renderer.rowFilter).toBe(rowFilter);
    expect(renderer.columnFilter).toBe(columnFilter);
  });

  it('should set row and column header functions and calculate their length after calling `setHeaderContentRenderers` method', () => {
    const { renderer } = createRenderer();

    const rowHeaderFunc1 = () => {};
    const rowHeaderFunc2 = () => {};
    const columnHeaderFunc1 = () => {};

    renderer.setHeaderContentRenderers([rowHeaderFunc1, rowHeaderFunc2], [columnHeaderFunc1]);

    expect(renderer.rowHeaderFunctions[0]).toBe(rowHeaderFunc1);
    expect(renderer.rowHeaderFunctions[1]).toBe(rowHeaderFunc2);
    expect(renderer.rowHeadersCount).toBe(2);
    expect(renderer.columnHeaderFunctions[0]).toBe(columnHeaderFunc1);
    expect(renderer.columnHeadersCount).toBe(1);
  });

  it('should set renderer instances after calling `setRenderers` method', () => {
    const { renderer } = createRenderer();

    const rowHeadersRenderer = new (class RowHeadersRenderer { setTable() {} })();
    const columnHeadersRenderer = new (class ColumnHeadersRenderer { setTable() {} })();
    const colGroupRenderer = new (class ColGroupRenderer { setTable() {} })();
    const rowsRenderer = new (class RowsRenderer { setTable() {} })();
    const cellsRenderer = new (class CellsRenderer { setTable() {} })();

    spyOn(rowHeadersRenderer, 'setTable');
    spyOn(columnHeadersRenderer, 'setTable');
    spyOn(colGroupRenderer, 'setTable');
    spyOn(rowsRenderer, 'setTable');
    spyOn(cellsRenderer, 'setTable');

    renderer.setRenderers({
      rowHeaders: rowHeadersRenderer,
      columnHeaders: columnHeadersRenderer,
      colGroup: colGroupRenderer,
      rows: rowsRenderer,
      cells: cellsRenderer,
    });

    expect(renderer.rowHeaders).toBe(rowHeadersRenderer);
    expect(renderer.columnHeaders).toBe(columnHeadersRenderer);
    expect(renderer.colGroup).toBe(colGroupRenderer);
    expect(renderer.rows).toBe(rowsRenderer);
    expect(renderer.cells).toBe(cellsRenderer);
    expect(rowHeadersRenderer.setTable).toHaveBeenCalledWith(renderer);
    expect(columnHeadersRenderer.setTable).toHaveBeenCalledWith(renderer);
    expect(colGroupRenderer.setTable).toHaveBeenCalledWith(renderer);
    expect(rowsRenderer.setTable).toHaveBeenCalledWith(renderer);
    expect(cellsRenderer.setTable).toHaveBeenCalledWith(renderer);
  });

  it('should translate rendered row index to source using rowFilter module', () => {
    const { renderer } = createRenderer();

    const rowFilter = new (class RowFilter { renderedToSource() {} })();
    const columnFilter = new (class ColumnFilter { renderedToSource() {} })();

    spyOn(rowFilter, 'renderedToSource').and.returnValue(4);
    spyOn(columnFilter, 'renderedToSource');

    renderer.setFilters(rowFilter, columnFilter);

    expect(renderer.renderedRowToSource(5)).toBe(4);
    expect(rowFilter.renderedToSource).toHaveBeenCalledWith(5);
    expect(columnFilter.renderedToSource).not.toHaveBeenCalled();
  });

  it('should translate rendered column index to source using columnFilter module', () => {
    const { renderer } = createRenderer();

    const rowFilter = new (class RowFilter { renderedToSource() {} })();
    const columnFilter = new (class ColumnFilter { renderedToSource() {} })();

    spyOn(rowFilter, 'renderedToSource');
    spyOn(columnFilter, 'renderedToSource').and.returnValue(4);

    renderer.setFilters(rowFilter, columnFilter);

    expect(renderer.renderedColumnToSource(5)).toBe(4);
    expect(columnFilter.renderedToSource).toHaveBeenCalledWith(5);
    expect(rowFilter.renderedToSource).not.toHaveBeenCalled();
  });

  it('should call `adjust` and `render` methods for all renderers', () => {
    const { renderer } = createRenderer();

    const rowHeadersRenderer = new (class RowHeadersRenderer {
      adjust() {}
      render() {}
    })();
    const columnHeadersRenderer = new (class ColumnHeadersRenderer {
      adjust() {}
      render() {}
    })();
    const colGroupRenderer = new (class ColGroupRenderer {
      adjust() {}
      render() {}
    })();
    const rowsRenderer = new (class RowsRenderer {
      adjust() {}
      render() {}
    })();
    const cellsRenderer = new (class CellsRenderer {
      adjust() {}
      render() {}
    })();
    const columnUtils = new (class ColumnUtils {
      calculateWidths() {}
    })();

    spyOn(rowHeadersRenderer, 'adjust');
    spyOn(rowHeadersRenderer, 'render');
    spyOn(columnHeadersRenderer, 'adjust');
    spyOn(columnHeadersRenderer, 'render');
    spyOn(colGroupRenderer, 'adjust');
    spyOn(colGroupRenderer, 'render');
    spyOn(rowsRenderer, 'adjust');
    spyOn(rowsRenderer, 'render');
    spyOn(cellsRenderer, 'adjust');
    spyOn(cellsRenderer, 'render');
    spyOn(columnUtils, 'calculateWidths');

    renderer.rowHeaders = rowHeadersRenderer;
    renderer.columnHeaders = columnHeadersRenderer;
    renderer.colGroup = colGroupRenderer;
    renderer.rows = rowsRenderer;
    renderer.cells = cellsRenderer;
    renderer.columnUtils = columnUtils;
    renderer.render();

    expect(rowHeadersRenderer.adjust).toHaveBeenCalledTimes(1);
    expect(columnHeadersRenderer.adjust).toHaveBeenCalledTimes(1);
    expect(colGroupRenderer.adjust).toHaveBeenCalledTimes(1);
    expect(rowsRenderer.adjust).toHaveBeenCalledTimes(1);

    expect(rowHeadersRenderer.render).toHaveBeenCalledTimes(1);
    expect(columnHeadersRenderer.render).toHaveBeenCalledTimes(1);
    expect(colGroupRenderer.render).toHaveBeenCalledTimes(1);
    expect(rowsRenderer.render).toHaveBeenCalledTimes(1);
    expect(cellsRenderer.render).toHaveBeenCalledTimes(1);

    expect(columnUtils.calculateWidths).toHaveBeenCalledTimes(1);
  });
});
