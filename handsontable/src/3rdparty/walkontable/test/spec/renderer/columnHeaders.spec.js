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
    const renderer = new Walkontable.Renderer.ColumnHeadersRenderer(rootNode);

    renderer.setTable(tableMock);

    return { renderer, tableMock, rootNode };
  }

  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class']
      }
    };
  });

  it('should generate as many TR (with TH) as the `columnHeadersCount`, `rowHeadersCount` and `columnsToRender` is set', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
    ];

    renderer.adjust();
    renderer.render();

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

    renderer.adjust();
    renderer.render();

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

    renderer.adjust();
    renderer.render();

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

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <thead>
        <tr></tr>
      </thead>
      `);

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 0;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '4'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '4'; },
    ];

    renderer.adjust();
    renderer.render();

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

  it('should reuse previously created elements on next render cycle', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
      (sourceColumnIndex, TH) => { TH.innerHTML = '1'; },
    ];

    renderer.adjust();
    renderer.render();

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

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[0].children[0]).toBe(prevChildren[0].children[0]);
    expect(rootNode.children[0].children[1]).toBe(prevChildren[0].children[1]);
    expect(rootNode.children[1].children[0]).toBe(prevChildren[1].children[0]);
    expect(rootNode.children[1].children[1]).toBe(prevChildren[1].children[1]);
  });

  it('should reuse previously created elements when offset is changed', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [() => {}, () => {}];

    renderer.adjust();
    renderer.render();

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

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[0].children[0]).toBe(prevChildren[0].children[0]);
    expect(rootNode.children[0].children[1]).toBe(prevChildren[0].children[1]);
    expect(rootNode.children[1].children[0]).toBe(prevChildren[1].children[0]);
    expect(rootNode.children[1].children[1]).toBe(prevChildren[1].children[1]);
  });

  it('should call column headers renderers with valid arguments', () => {
    const { renderer, tableMock } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [headerRenderer1, headerRenderer2];

    renderer.adjust();
    renderer.render();

    expect(headerRenderer1.calls.argsFor(0)).toEqual([-1, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([0, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(2)).toEqual([1, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer2.calls.argsFor(0)).toEqual([-1, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(1)).toEqual([0, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(2)).toEqual([1, jasmine.any(HTMLTableCellElement), 1]);
  });

  it('should call column headers renderers with valid arguments when offset is applied', () => {
    const { renderer, tableMock } = createRenderer();

    const headerRenderer1 = jasmine.createSpy();
    const headerRenderer2 = jasmine.createSpy();

    tableMock.columnsToRender = 2;
    tableMock.columnHeadersCount = 2;
    tableMock.rowHeadersCount = 1;
    tableMock.columnHeaderFunctions = [headerRenderer1, headerRenderer2];

    spyOn(tableMock, 'renderedColumnToSource').and.callFake((index) => {
      return index + 10;
    });

    renderer.adjust();
    renderer.render();

    expect(headerRenderer1.calls.argsFor(0)).toEqual([9, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(1)).toEqual([10, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer1.calls.argsFor(2)).toEqual([11, jasmine.any(HTMLTableCellElement), 0]);
    expect(headerRenderer2.calls.argsFor(0)).toEqual([9, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(1)).toEqual([10, jasmine.any(HTMLTableCellElement), 1]);
    expect(headerRenderer2.calls.argsFor(2)).toEqual([11, jasmine.any(HTMLTableCellElement), 1]);
  });
});
