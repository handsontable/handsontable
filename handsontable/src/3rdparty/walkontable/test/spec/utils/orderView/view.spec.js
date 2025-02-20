describe('Walkontable.OrderView', () => {
  function createOrderView(rootNodeType, childNodeType) {
    const rootNode = document.createElement(rootNodeType);
    const nodesPool = new Walkontable.NodesPool(childNodeType);

    nodesPool.setRootDocument(document);

    const orderView = new Walkontable.OrderView(rootNode, sourceIndex => nodesPool.obtain(sourceIndex));

    return { orderView, rootNode };
  }

  it('should generate correct DOM structure', () => {
    const { orderView, rootNode } = createOrderView('tr', 'td');

    orderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);
  });

  it('should generate correct DOM structure while increasing/decreasing view size', () => {
    const { orderView, rootNode } = createOrderView('div', 'p');

    orderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div>
        <p></p>
        <p></p>
        <p></p>
      </div>
      `);

    orderView.setSize(0);

    orderView.start();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div></div>
      `);

    orderView.setSize(2);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div>
        <p></p>
        <p></p>
      </div>
      `);

    orderView.setSize(10);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
      </div>
      `);
  });

  it('should reuse already created elements after rerendering the View', () => {
    const { orderView, rootNode } = createOrderView('colgroup', 'col');

    orderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <colgroup>
        <col>
        <col>
        <col>
      </colgroup>
      `);

    const prevChildren = rootNode.childNodes;

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.render();
    orderView.end();

    expect(rootNode.childNodes[0]).toBe(prevChildren[0]);
    expect(rootNode.childNodes[1]).toBe(prevChildren[1]);
    expect(rootNode.childNodes[2]).toBe(prevChildren[2]);
    expect(rootNode.childNodes[3]).toBe(undefined);
  });

  it('should make created element accessible after each render cycle', () => {
    const { orderView, rootNode } = createOrderView('tr', 'td');

    orderView.setSize(3);

    orderView.start();
    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }

    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }

    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }
    orderView.end();

    expect(orderView.getNode(0)).toBe(rootNode.childNodes[0]);
    expect(orderView.getNode(1)).toBe(rootNode.childNodes[1]);
    expect(orderView.getNode(2)).toBe(rootNode.childNodes[2]);
  });

  it('should make created element accessible after each render cycle', () => {
    const { orderView, rootNode } = createOrderView('tr', 'td');

    orderView.setSize(3);

    orderView.start();
    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }

    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }

    orderView.render();

    {
      const currentNode = orderView.getCurrentNode();

      expect(currentNode.tagName).toBe('TD');
    }
    orderView.end();

    expect(orderView.getNode(0)).toBe(rootNode.childNodes[0]);
    expect(orderView.getNode(1)).toBe(rootNode.childNodes[1]);
    expect(orderView.getNode(2)).toBe(rootNode.childNodes[2]);
  });
});
