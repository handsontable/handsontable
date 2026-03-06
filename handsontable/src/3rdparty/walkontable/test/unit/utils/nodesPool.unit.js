import { NodesPool } from 'walkontable/utils/nodesPool';

describe('NodesPool', () => {
  it('should be correctly constructed', () => {
    const nodePool = new NodesPool('div');

    expect(nodePool.nodeType).toBe('DIV');
  });

  describe('setRootDocument()', () => {
    it('should set root document object', () => {
      const nodePool = new NodesPool('div');
      const rootDocument = document;

      nodePool.setRootDocument(rootDocument);

      expect(nodePool.rootDocument).toBe(rootDocument);
    });
  });

  describe('obtain()', () => {
    it('should return an element based on defined node type', () => {
      const nodePool = new NodesPool('div');
      const rootDocument = document;

      nodePool.setRootDocument(rootDocument);

      expect(nodePool.obtain(1, 2).tagName).toBe('DIV');
    });

    it('should return element from cache (the one argument as a key)', () => {
      const nodePool = new NodesPool('div');
      const rootDocument = document;

      nodePool.setRootDocument(rootDocument);

      spyOn(document, 'createElement').and.callThrough();
      nodePool.obtain(2);
      nodePool.obtain(2);
      nodePool.obtain(2);

      expect(document.createElement).toBeCalledTimes(1);
      expect(nodePool.obtain(2).tagName).toBe('DIV');
    });

    it('should return element from cache (the two arguments as a key)', () => {
      const nodePool = new NodesPool('div');
      const rootDocument = document;

      nodePool.setRootDocument(rootDocument);

      spyOn(document, 'createElement').and.callThrough();
      nodePool.obtain(1, 2);
      nodePool.obtain(1, 2);
      nodePool.obtain(1, 2);

      expect(document.createElement).toBeCalledTimes(1);
      expect(nodePool.obtain(1, 2).tagName).toBe('DIV');
    });
  });
});
