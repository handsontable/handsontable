describe('Walkontable.Renderer.ColumnHeadersRenderer', () => {
  class TableRendererMock {
    constructor() {
      this.rootDocument = document;
    }
    renderedColumnToSource(visibleColumnIndex) {
      return visibleColumnIndex;
    }

    isAriaEnabled() {
      return true;
    }
  }

  function createRenderer() {
    const rootNode = document.createElement('thead');
    const tableMock = new TableRendererMock();
    const columnHeaderRowsRenderer = new Walkontable.Renderer.ColumnHeaderRowsRenderer(rootNode);
    const columnHeadersRenderer = new Walkontable.Renderer.ColumnHeadersRenderer();

    columnHeaderRowsRenderer.setTable(tableMock);
    columnHeadersRenderer.setTable(tableMock);

    tableMock.columnHeaderRows = columnHeaderRowsRenderer;

    return { columnHeaderRowsRenderer, columnHeadersRenderer, tableMock, rootNode };
  }

  function renderAll({ columnHeaderRowsRenderer, columnHeadersRenderer }) {

    columnHeaderRowsRenderer.render();
    columnHeadersRenderer.render();
  }

  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class']
      }
    };
  });

  it('should generate as many TR (with TH) as the `columnHeadersCount`, `rowHeadersCount` and `columnsToRender` is set', async() => {
    const renderers = createRenderer();
    const { tableMock, rootNode } = renderers;

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
    ];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class="">1</th>
          <th class="">1</th>
          <th class="">1</th>
        </tr>
        <tr>
          <th class="">1</th>
          <th class="">1</th>
          <th class="">1</th>
        </tr>
      </thead>
      `);

    tableMock.columnsToRender = 1;
    tableMock.columnHeadersCount = 1;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '2'; },
    ];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class="">2</th>
          <th class="">2</th>
        </tr>
      </thead>
      `);

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 1;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '3'; },
    ];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class="">3</th>
          <th class="">3</th>
        </tr>
      </thead>
      `);

    tableMock.columnsToRender = 0;
    tableMock.columnHeadersCount = 0;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead></thead>
      `);

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '4'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '4'; },
    ];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class="">4</th>
          <th class="">4</th>
        </tr>
        <tr>
          <th class="">4</th>
          <th class="">4</th>
        </tr>
      </thead>
      `);
  });

  it('should reuse previously created elements on next render cycle', async() => {
    const renderers = createRenderer();
    const { tableMock, rootNode } = renderers;

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
    ];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class="">1</th>
          <th class="">1</th>
          <th class="">1</th>
        </tr>
        <tr>
          <th class="">1</th>
          <th class="">1</th>
          <th class="">1</th>
        </tr>
      </thead>
      `);

    const prevChildren = rootNode.children;

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '2'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '2'; },
    ];

    renderAll(renderers);

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[0].children[0]).toBe(prevChildren[0].children[0]);
    expect(rootNode.children[0].children[1]).toBe(prevChildren[0].children[1]);
    expect(rootNode.children[1].children[0]).toBe(prevChildren[1].children[0]);
    expect(rootNode.children[1].children[1]).toBe(prevChildren[1].children[1]);
  });

  it('should reuse previously created elements when offset is changed', async() => {
    const renderers = createRenderer();
    const { tableMock, rootNode } = renderers;

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [() => {}, () => {}];

    renderAll(renderers);

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
        </tr>
        <tr>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
        </tr>
      </thead>
      `);

    const prevChildren = rootNode.children;

    spyOn(tableMock, 'renderedColumnToSource').and.callFake((index) => {
      return index + 10;
    });

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [() => {}, () => {}];

    renderAll(renderers);

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[0].children[0]).toBe(prevChildren[0].children[0]);
    expect(rootNode.children[0].children[1]).toBe(prevChildren[0].children[1]);
    expect(rootNode.children[1].children[0]).toBe(prevChildren[1].children[0]);
    expect(rootNode.children[1].children[1]).toBe(prevChildren[1].children[1]);
  });

  it('should call column headers renderers with valid arguments', async() => {
    const renderers = createRenderer();
    const { tableMock } = renderers;

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [headerRenderer1, headerRenderer2];

    renderAll(renderers);

    expect(headerRenderer1.calls.argsFor(0)).toEqual([-1, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([0, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(2)).toEqual([1, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer2.calls.argsFor(0)).toEqual([-1, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(1)).toEqual([0, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(2)).toEqual([1, jasmine.any(HTMLTableCellElement), 1]);
  });

  it('should call column headers renderers with valid arguments when offset is applied', async() => {
    const renderers = createRenderer();
    const { tableMock } = renderers;

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [headerRenderer1, headerRenderer2];

    spyOn(tableMock, 'renderedColumnToSource').and.callFake((index) => {
      return index + 10;
    });

    renderAll(renderers);

    expect(headerRenderer1.calls.argsFor(0)).toEqual([9, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([10, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(2)).toEqual([11, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer2.calls.argsFor(0)).toEqual([9, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(1)).toEqual([10, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(2)).toEqual([11, jasmine.any(HTMLTableCellElement), 1]);
  });
});
