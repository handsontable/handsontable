describe('Walkontable.Renderer.RowHeadersRenderer', () => {
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
    const cellsRenderer = new Walkontable.Renderer.CellsRenderer();
    const rowHeadersRenderer = new Walkontable.Renderer.RowHeadersRenderer();

    rowsRenderer.setTable(tableMock);
    tableMock.rows = rowsRenderer;
    cellsRenderer.setTable(tableMock);
    tableMock.cells = cellsRenderer;
    rowHeadersRenderer.setTable(tableMock);
    tableMock.rowHeaders = rowHeadersRenderer;

    return { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode };
  }

  it('should not generate any row headers', () => {
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

  it('should generate row headers before cells', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();
    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [headerRenderer1, headerRenderer2];
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
    expect(headerRenderer1.calls.argsFor(0)).toEqual([0, jasmine.any(HTMLElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([1, jasmine.any(HTMLElement), 0]);
    expect(headerRenderer2).not.toHaveBeenCalled();
  });

  it('should generate row headers before cells after rendering the renderers from 0 to N cells', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 0;
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
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    const headerRenderer1 = jasmine.createSpy();

    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [headerRenderer1];

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
  });

  it('should reuse row header elements after next render call', () => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();
    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [];
    tableMock.cellRenderer = cellRenderer;
    tableMock.rowHeaderFunctions = [headerRenderer1, headerRenderer2];

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

    const TR1 = rowsRenderer.getRenderedNode(0);
    const TR2 = rowsRenderer.getRenderedNode(1);

    rowsRenderer.adjust();
    rowHeadersRenderer.adjust();
    cellsRenderer.adjust();

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.childNodes[0].childNodes[0]).toBe(TR1.childNodes[0]);
    expect(rootNode.childNodes[1].childNodes[0]).toBe(TR2.childNodes[0]);
  });
});
