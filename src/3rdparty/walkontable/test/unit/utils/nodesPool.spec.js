import NodesPool from 'walkontable/utils/nodesPool';

describe('NodesPool', () => {
  it('should be correctly constructed', () => {
    const nodePool = new NodesPool('div');

    expect(nodePool.nodeType).toBe('DIV');
  });

  it('should set root document object through `setRootDocument` method', () => {
    const nodePool = new NodesPool('div');
    const rootDocument = document;

    nodePool.setRootDocument(rootDocument);

    expect(nodePool.rootDocument).toBe(rootDocument);
  });

  it('should obtain an element based on defined node type', () => {
    const nodePool = new NodesPool('div');
    const rootDocument = document;

    nodePool.setRootDocument(rootDocument);

    expect(nodePool.obtain().tagName).toBe('DIV');
  });
});
