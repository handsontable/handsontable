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

    it('should always create a fresh element (no caching)', () => {
      const nodePool = new NodesPool('div');
      const rootDocument = document;

      nodePool.setRootDocument(rootDocument);

      spyOn(document, 'createElement').and.callThrough();
      const a = nodePool.obtain();
      const b = nodePool.obtain();
      const c = nodePool.obtain();

      expect(document.createElement).toBeCalledTimes(3);
      expect(a).not.toBe(b);
      expect(b).not.toBe(c);
      expect(a.tagName).toBe('DIV');
    });
  });
});
