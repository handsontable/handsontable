describe('Walkontable.Renderer.CellsRenderer', () => {
  class TableRendererMock {
    constructor() {
      this.rootDocument = document;
    }
    renderedRowToSource(visibleRowIndex) {
      return visibleRowIndex;
    }
    renderedColumnToSource(visibleColumnIndex) {
      return visibleColumnIndex;
    }
  }

  function createRenderer() {
    const rootNode = document.createElement('tbody');
    const tableMock = new TableRendererMock();
    const rowsRenderer = new Walkontable.Renderer.RowsRenderer(rootNode);
    const rowHeadersRenderer = new Walkontable.Renderer.RowHeadersRenderer();
    const cellsRenderer = new Walkontable.Renderer.CellsRenderer();

    rowsRenderer.setTable(tableMock);
    tableMock.rows = rowsRenderer;
    cellsRenderer.setTable(tableMock);
    tableMock.cells = cellsRenderer;
    rowHeadersRenderer.setTable(tableMock);
    tableMock.rowHeaders = rowHeadersRenderer;

    return { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode };
  }

  it('should not generate any cells', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 5;
    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
        <tr></tr>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);
  });

  it('should generate as many cells as `columnsToRender` is set', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [headerRenderer1];
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <th class=""></th>
          <td class=""></td>
          <td class=""></td>
        </tr>
        <tr>
          <th class=""></th>
          <td class=""></td>
          <td class=""></td>
        </tr>
      </tbody>
      `);
    expect(cellRenderer.calls.argsFor(0)).toEqual([0, 0, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(1)).toEqual([0, 1, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(2)).toEqual([1, 0, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(3)).toEqual([1, 1, jasmine.any(HTMLElement)]);
    expect(cellRenderer).toHaveBeenCalledTimes(4);
  });

  it('should generate cells properly after rerendering the cells from 0 to N cells', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    tableMock.columnsToRender = 3;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td class=""></td>
          <td class=""></td>
          <td class=""></td>
        </tr>
        <tr>
          <td class=""></td>
          <td class=""></td>
          <td class=""></td>
        </tr>
      </tbody>
      `);
  });

  it('should reuse cell elements after next render call', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 3;
    tableMock.rowHeadersCount = 0;
    tableMock.rowHeaderFunctions = [];
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td class=""></td>
          <td class=""></td>
          <td class=""></td>
        </tr>
        <tr>
          <td class=""></td>
          <td class=""></td>
          <td class=""></td>
        </tr>
      </tbody>
      `);

    const tdsForTr1 = rootNode.childNodes[0].childNodes;
    const tdsForTr2 = rootNode.childNodes[1].childNodes;

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.childNodes[0].childNodes[0]).toBe(tdsForTr1[0]);
    expect(rootNode.childNodes[0].childNodes[1]).toBe(tdsForTr1[1]);
    expect(rootNode.childNodes[0].childNodes[2]).toBe(tdsForTr1[2]);
    expect(rootNode.childNodes[1].childNodes[0]).toBe(tdsForTr2[0]);
    expect(rootNode.childNodes[1].childNodes[1]).toBe(tdsForTr2[1]);
    expect(rootNode.childNodes[1].childNodes[2]).toBe(tdsForTr2[2]);
  });
});
