describe('Walkontable.Renderer.RowsRenderer', () => {
  class TableRendererMock {
    constructor() {
      this.rootDocument = document;
    }
    renderedRowToSource(visibleRowIndex) {
      return visibleRowIndex;
    }
  }

  function createRenderer() {
    const rootNode = document.createElement('tbody');
    const tableMock = new TableRendererMock();
    const renderer = new Walkontable.Renderer.RowsRenderer(rootNode);

    renderer.setTable(tableMock);

    return { renderer, tableMock, rootNode };
  }

  it('should generate as many rows as the `rowsToRender` is set', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 5;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
        <tr></tr>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    tableMock.rowsToRender = 3;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    tableMock.rowsToRender = 0;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody></tbody>
      `);

    tableMock.rowsToRender = 1;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
      </tbody>
      `);
  });

  it('should reuse previously created elements on next render cycle', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 3;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    const prevChildren = rootNode.children;

    tableMock.rowsToRender = 5;

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[2]).toBe(prevChildren[2]);
  });

  it('should reuse previously created elements when offset is changed', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 3;

    renderer.adjust();
    renderer.render();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tbody>
        <tr></tr>
        <tr></tr>
        <tr></tr>
      </tbody>
      `);

    const prevChildren = rootNode.children;

    spyOn(tableMock, 'renderedRowToSource').and.callFake((index) => {
      return index + 10;
    });

    renderer.adjust();
    renderer.render();

    expect(rootNode.children[0]).toBe(prevChildren[0]);
    expect(rootNode.children[1]).toBe(prevChildren[1]);
    expect(rootNode.children[2]).toBe(prevChildren[2]);
  });

  it('should return all rendered nodes using `getRenderedNode` method', () => {
    const { renderer, tableMock, rootNode } = createRenderer();

    tableMock.rowsToRender = 3;

    renderer.adjust();
    renderer.render();

    const children = rootNode.children;

    expect(renderer.getRenderedNode(0)).toBe(children[0]);
    expect(renderer.getRenderedNode(1)).toBe(children[1]);
    expect(renderer.getRenderedNode(2)).toBe(children[2]);
    expect(renderer.getRenderedNode(3)).toBe(null);
  });
});
