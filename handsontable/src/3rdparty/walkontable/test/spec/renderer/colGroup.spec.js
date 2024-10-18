describe('Walkontable.Renderer.ColGroupRenderer', () => {
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

  class ColumnUtilsMock {
    getWidth() {
      return 100;
    }
    getHeaderWidth() {
      return 100;
    }
  }

  function createRenderer() {
    const rootNode = document.createElement('colgroup');
    const tableMock = new TableRendererMock();
    const columnUtilsMock = new ColumnUtilsMock();
    const renderer = new Walkontable.Renderer.ColGroupRenderer(rootNode);

    tableMock.columnUtils = columnUtilsMock;
    renderer.setTable(tableMock);

    return { renderer, tableMock, columnUtilsMock, rootNode };
  }

  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'style']
      }
    };
  });

  it('should generate as many COLs as the `columnsToRender` and `rowHeadersCount` is set', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 5;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      `);

    tableMock.columnsToRender = 3;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      `);

    tableMock.columnsToRender = 3;
    tableMock.rowHeadersCount = 0;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      `);

    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 0;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup></colgroup>
      `);

    tableMock.columnsToRender = 0;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
      </colgroup>
      `);
  });

  it('should reuse previously created elements on next render cycle', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 5;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      `);

    const prevChildren = rootNode.children;

    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[2]).toBe(prevChildren[2]);
  });

  it('should reuse previously created elements when offset is changed', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      `);

    const prevChildren = rootNode.children;

    spyOn(tableMock, 'renderedColumnToSource').and.callFake((index) => {
      return index + 10;
    });

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[2]).toBe(prevChildren[2]);
  });

  it('should render column widths', () => {
    const { renderer, tableMock, rootNode, columnUtilsMock } = createRenderer();

    spyOn(columnUtilsMock, 'getHeaderWidth').and.callFake((sourceColumnIndex) => {
      return sourceColumnIndex + 100;
    });
    spyOn(columnUtilsMock, 'getWidth').and.callFake((sourceColumnIndex) => {
      return sourceColumnIndex + 100;
    });

    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 2;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 100px;">
        <col style="width: 101px;">
        <col style="width: 100px;">
        <col style="width: 101px;">
      </colgroup>
      `);
  });

  it('should render column widths based on source column index (offset value)', () => {
    const { renderer, tableMock, rootNode, columnUtilsMock } = createRenderer();

    spyOn(tableMock, 'renderedColumnToSource').and.callFake((index) => {
      return index + 10;
    });
    spyOn(columnUtilsMock, 'getHeaderWidth').and.callFake((sourceColumnIndex) => {
      return sourceColumnIndex + 100;
    });
    spyOn(columnUtilsMock, 'getWidth').and.callFake((sourceColumnIndex) => {
      return sourceColumnIndex + 100;
    });

    tableMock.columnsToRender = 2;
    tableMock.rowHeadersCount = 2;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col class="rowHeader" style="width: 110px;">
        <col style="width: 111px;">
        <col style="width: 110px;">
        <col style="width: 111px;">
      </colgroup>
      `);
  });
});
