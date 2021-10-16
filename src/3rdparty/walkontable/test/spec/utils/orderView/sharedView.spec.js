describe('Walkontable.SharedOrderView', () => {
  function createSharedOrderView(rootNode, childNodeType) {
    const nodesPool = new Walkontable.NodesPool(childNodeType);

    nodesPool.setRootDocument(document);

    const orderView = new Walkontable.SharedOrderView(rootNode, sourceIndex => nodesPool.obtain(sourceIndex));

    return { orderView };
  }

  it('should generate correct DOM structuree', () => {
    const rootNode = document.createElement('tr');
    const { orderView } = createSharedOrderView(rootNode, 'th');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'td');

    orderView.appendView(secondOrderView);

    orderView.setSize(2);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);
  });

  it('should generate correct DOM structure while decreasing first OrderView size', () => {
    const rootNode = document.createElement('tr');
    const { orderView } = createSharedOrderView(rootNode, 'th');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'td');

    orderView.appendView(secondOrderView);

    orderView.setSize(2);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);

    orderView.setSize(1);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);

    orderView.setSize(0);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);
  });

  it('should generate correct DOM structure while increasing first OrderView size', () => {
    const rootNode = document.createElement('tr');
    const { orderView } = createSharedOrderView(rootNode, 'th');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'td');

    orderView.appendView(secondOrderView);

    orderView.setSize(0);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);

    orderView.setSize(1);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);

    orderView.setSize(3);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);
  });

  it('should generate correct DOM structure while decreasing last OrderView size', () => {
    const rootNode = document.createElement('tr');
    const { orderView } = createSharedOrderView(rootNode, 'th');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'td');

    orderView.appendView(secondOrderView);

    orderView.setSize(2);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);

    orderView.setSize(2);
    secondOrderView.setSize(1);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
      </tr>
      `);

    orderView.setSize(2);
    secondOrderView.setSize(0);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
      </tr>
      `);
  });

  it('should generate correct DOM structure while increasing last OrderView size', () => {
    const rootNode = document.createElement('tr');
    const { orderView } = createSharedOrderView(rootNode, 'th');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'td');

    orderView.appendView(secondOrderView);

    orderView.setSize(2);
    secondOrderView.setSize(0);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
      </tr>
      `);

    orderView.setSize(2);
    secondOrderView.setSize(1);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
      </tr>
      `);

    orderView.setSize(2);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <tr>
        <th></th>
        <th></th>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `);
  });

  it('should reuse already created elements after rerendering the View', () => {
    const rootNode = document.createElement('div');
    const { orderView } = createSharedOrderView(rootNode, 'p');
    const { orderView: secondOrderView } = createSharedOrderView(rootNode, 'div');

    orderView.appendView(secondOrderView);

    orderView.setSize(2);
    secondOrderView.setSize(3);

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div>
        <p></p>
        <p></p>
        <div></div>
        <div></div>
        <div></div>
      </div>
      `);

    const prevChildNodes = rootNode.childNodes;

    orderView.start();
    orderView.render();
    orderView.render();
    orderView.end();

    secondOrderView.start();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.render();
    secondOrderView.end();

    expect(rootNode.outerHTML).toMatchHTML(`
      <div>
        <p></p>
        <p></p>
        <div></div>
        <div></div>
        <div></div>
      </div>
      `);
    expect(rootNode.childNodes[0]).toBe(prevChildNodes[0]);
    expect(rootNode.childNodes[1]).toBe(prevChildNodes[1]);
    expect(rootNode.childNodes[2]).toBe(prevChildNodes[2]);
    expect(rootNode.childNodes[3]).toBe(prevChildNodes[3]);
    expect(rootNode.childNodes[4]).toBe(prevChildNodes[4]);
  });
});
