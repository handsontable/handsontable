describe('Walkontable.Renderer.CellsRenderer', () => {
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

  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['dir', 'style']
      }
    };
  });

  it('should not generate any cells', async() => {
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

  it('should generate as many cells as `columnsToRender` is set', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.rowHeaderFunctions = [headerRenderer1];
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
    expect(cellRenderer.calls.argsFor(0)).toEqual([0, 0, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(1)).toEqual([0, 1, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(2)).toEqual([1, 0, jasmine.any(HTMLElement)]);
    expect(cellRenderer.calls.argsFor(3)).toEqual([1, 1, jasmine.any(HTMLElement)]);
    expect(cellRenderer).toHaveBeenCalledTimes(4);
  });

  it('should clear "style" and "dir" attributes from the cell element each render cycle', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 3;
    tableMock.rowHeadersCount = 0;
    tableMock.cellRenderer = (sourceRowIndex, sourceColumnIndex, TD) => {
      TD.style.width = '60px';
      TD.dir = 'rtl';
    };

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td dir="rtl" style="width: 60px;"></td>
          <td dir="rtl" style="width: 60px;"></td>
          <td dir="rtl" style="width: 60px;"></td>
        </tr>
        <tr>
          <td dir="rtl" style="width: 60px;"></td>
          <td dir="rtl" style="width: 60px;"></td>
          <td dir="rtl" style="width: 60px;"></td>
        </tr>
      </tbody>
      `);

    tableMock.cellRenderer = () => {}; // reset the cell renderer function

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);
  });

  it('should generate cells properly after rerendering the cells from 0 to N cells', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;
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

    tableMock.columnsToRender = 3;

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);
  });

  it('should reuse cell elements after next render call', async() => {
    const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

    const cellRenderer = jasmine.createSpy();

    tableMock.rowsToRender = 2;
    tableMock.columnsToRender = 3;
    tableMock.rowHeadersCount = 0;
    tableMock.rowHeaderFunctions = [];
    tableMock.cellRenderer = cellRenderer;

    rowsRenderer.render();
    rowHeadersRenderer.render();
    cellsRenderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      `);

    const tdsForTr1 = rootNode.childNodes[0].childNodes;
    const tdsForTr2 = rootNode.childNodes[1].childNodes;

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

  describe('paint window (`paintFromRow`)', () => {
    it('should repaint only the rows at and after `paintFromRow`, leaving the rows before it untouched', async() => {
      const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

      const cellRenderer = jasmine.createSpy().and.callFake((row, column, TD) => {
        TD.innerHTML = `${tableMock.pass}:${row},${column}`;
      });

      tableMock.pass = 'a';
      tableMock.rowsToRender = 2;
      tableMock.columnsToRender = 2;
      tableMock.rowHeadersCount = 0;
      tableMock.rowHeaderFunctions = [];
      tableMock.cellRenderer = cellRenderer;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      // The band grows by two rows and only those two are new: the rows before the window hold the
      // same source rows in the same columns, so their elements must be left exactly as they are.
      const untouchedTD = rootNode.querySelector('tr:nth-child(1) td:nth-child(2)');

      untouchedTD.className = 'kept';
      untouchedTD.style.color = 'red';

      cellRenderer.calls.reset();
      tableMock.pass = 'b';
      tableMock.rowsToRender = 4;
      tableMock.paintFromRow = 2;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      expect(cellRenderer).toHaveBeenCalledTimes(4);
      expect(cellRenderer.calls.allArgs().map(([row, column]) => [row, column]))
        .toEqual([[2, 0], [2, 1], [3, 0], [3, 1]]);
      // A painted cell has its class reset; an untouched one keeps it (`toMatchHTML` drops classes).
      expect(untouchedTD.className).toBe('kept');
      expect(rootNode.outerHTML).toMatchHTML(`
        <tbody>
          <tr>
            <td>a:0,0</td>
            <td style="color: red;">a:0,1</td>
          </tr>
          <tr>
            <td>a:1,0</td>
            <td>a:1,1</td>
          </tr>
          <tr>
            <td>b:2,0</td>
            <td>b:2,1</td>
          </tr>
          <tr>
            <td>b:3,0</td>
            <td>b:3,1</td>
          </tr>
        </tbody>
        `);
    });

    it('should paint nothing when `paintFromRow` covers the whole band', async() => {
      const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock, rootNode } = createRenderer();

      const cellRenderer = jasmine.createSpy().and.callFake((row, column, TD) => {
        TD.innerHTML = `${row},${column}`;
      });

      tableMock.rowsToRender = 2;
      tableMock.columnsToRender = 1;
      tableMock.rowHeadersCount = 0;
      tableMock.rowHeaderFunctions = [];
      tableMock.cellRenderer = cellRenderer;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      cellRenderer.calls.reset();
      tableMock.paintFromRow = 2;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      expect(cellRenderer).not.toHaveBeenCalled();
      expect(rootNode.outerHTML).toMatchHTML(`
        <tbody>
          <tr><td>0,0</td></tr>
          <tr><td>1,0</td></tr>
        </tbody>
        `);
    });

    it('should not ask `shouldPaintCell` for the rows before `paintFromRow`', async() => {
      const { rowHeadersRenderer, rowsRenderer, cellsRenderer, tableMock } = createRenderer();

      const shouldPaintCell = spyOn(tableMock, 'shouldPaintCell').and.returnValue(true);

      tableMock.rowsToRender = 3;
      tableMock.columnsToRender = 1;
      tableMock.rowHeadersCount = 0;
      tableMock.rowHeaderFunctions = [];
      tableMock.cellRenderer = () => {};

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      shouldPaintCell.calls.reset();
      tableMock.paintFromRow = 1;

      rowsRenderer.render();
      rowHeadersRenderer.render();
      cellsRenderer.render();

      expect(shouldPaintCell.calls.allArgs().map(([row]) => row)).toEqual([1, 2]);
    });
  });
});
