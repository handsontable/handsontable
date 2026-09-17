describe('Walkontable.Renderer.RowHeadersRenderer', () => {
  class TableRendererMock {
    shouldPaintCell() {
      return true;
    }

    isRowRecyclingAllowed() {
      return false;
    }

    hasStableCellIdentity() {
      return false;
    }

    constructor() {
      this.rootDocument = document;
      this.paintFromRow = 0;
    }
    renderedRowToSource(visibleRowIndex) {
      return visibleRowIndex;
    }
    renderedColumnToSource(visibleColumnIndex) {
      return visibleColumnIndex;
    }

    isAriaEnabled() {
      return true;
    }

    hasColumnHeaders() {
      return false;
    }

    ownsAriaColumnHeaderId() {
      return false;
    }

    getAriaColumnHeaderIdPrefix() {
      return '';
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

  it('should not generate any row headers', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 5;
    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;

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

  it('should generate row headers before cells', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();
    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [headerRenderer1, headerRenderer2];
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);
    expect(headerRenderer1.calls.argsFor(0)).toEqual([0, jasmine.any(HTMLElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([1, jasmine.any(HTMLElement), 0]);
    expect(headerRenderer2).not.toHaveBeenCalled();
  });

  it('should generate row headers before cells after rendering the renderers from 0 to N cells', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;
    tableMock.rowHeaderFunctions = [];
    tableMock.cellRenderer = cellRenderer;

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

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);
  });

  it('should reuse row header elements after next render call', async() => {
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

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);

    const TR1 = rowsRenderer.getRenderedNode(0);
    const TR2 = rowsRenderer.getRenderedNode(1);

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.childNodes[0].childNodes[0]).toBe(TR1.childNodes[0]);
    expect(rootNode.childNodes[1].childNodes[0]).toBe(TR2.childNodes[0]);
  });

  it('should render multi-level row headers in the correct order', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const headerRenderer1 = (_, TH) => { TH.innerHTML = 'HeaderOne'; };
    const headerRenderer2 = (_, TH) => { TH.innerHTML = 'HeaderTwo'; };
    const cellRenderer = () => {};

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 2;
    tableMock.rowHeaderFunctions = [headerRenderer1, headerRenderer2];
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <th>HeaderOne</th>
          <th>HeaderTwo</th>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <th>HeaderOne</th>
          <th>HeaderTwo</th>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);
  });

  describe('paint window (`paintFromRow`)', () => {
    it('should repaint only the row headers at and after `paintFromRow`', async() => {
      const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

      const headerRenderer = jasmine.createSpy().and.callFake((row, TH) => {
        TH.innerHTML = `${tableMock.pass}:${row}`;
      });

      tableMock.pass = 'a';
      tableMock.rowsToRender = 2;
      tableMock.columnsToRender = 1;
      tableMock.rowHeadersCount = 1;
      tableMock.rowHeaderFunctions = [headerRenderer];
      tableMock.cellRenderer = () => {};

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      // Row headers and cells share one order view per TR, so a skipped row is skipped by BOTH
      // renderers - the TH count of an untouched row must not drift.
      const untouchedTH = rootNode.querySelector('tr:nth-child(1) th');

      untouchedTH.className = 'kept';

      headerRenderer.calls.reset();
      tableMock.pass = 'b';
      tableMock.rowsToRender = 3;
      tableMock.paintFromRow = 2;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      expect(headerRenderer).toHaveBeenCalledTimes(1);
      expect(headerRenderer.calls.argsFor(0)[0]).toBe(2);
      expect(rootNode.querySelectorAll('tr:nth-child(1) th').length).toBe(1);
      expect(rootNode.querySelectorAll('tr:nth-child(1) td').length).toBe(1);
      expect(untouchedTH.className).toBe('kept');
      expect(untouchedTH.innerHTML).toBe('a:0');
      expect(rootNode.querySelector('tr:nth-child(2) th').innerHTML).toBe('a:1');
      expect(rootNode.querySelector('tr:nth-child(3) th').innerHTML).toBe('b:2');
    });
  });
});
