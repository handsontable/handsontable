import TreeNode, { TRAVERSAL_DF_PRE, TRAVERSAL_DF_POST, TRAVERSAL_BF } from 'handsontable/utils/dataStructures/tree';

function createNode(id, childs = []) {
  const node = new TreeNode({ id });

  node.childs = childs;

  return node;
}

describe('TreeNode', () => {
  it('should construct properly', () => {
    const node = createNode('test');

    expect(node.data.id).toBe('test');
    expect(node.childs).toEqual([]);
  });

  describe('walk()', () => {
    it('should properly traverse a tree using default startegy (depth-first pre-order)', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            createNode('D6'),
          ]),
          createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);
      const traversalOrder = [];

      tree.walk(node => void traversalOrder.push(node.data.id));

      expect(traversalOrder).toEqual(['A1', 'B1', 'C1', 'D1', 'C2', 'D2', 'D3', 'D4', 'B2', 'C3', 'D5', 'D6', 'C4', 'D7', 'D8']);
    });

    it('should properly traverse a tree using depth-first pre-order startegy', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            createNode('D6'),
          ]),
          createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);
      const traversalOrder = [];

      tree.walk(node => void traversalOrder.push(node.data.id), TRAVERSAL_DF_PRE);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> C1 -> D1 -> C2 -> D2 -> D3 -> D4 -> B2 -> C3 -> D5 -> D6 -> C4 -> D7 -> D8');
    });

    it('should properly traverse a tree using depth-first post-order startegy', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            createNode('D6'),
          ]),
          createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);
      const traversalOrder = [];

      tree.walk(node => void traversalOrder.push(node.data.id), TRAVERSAL_DF_POST);

      expect(traversalOrder.join(' -> ')).toBe('D1 -> C1 -> D2 -> D3 -> D4 -> C2 -> B1 -> D5 -> D6 -> C3 -> D7 -> D8 -> C4 -> B2 -> A1');
    });

    it('should properly traverse a tree using breadth-first startegy', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            createNode('D6'),
          ]),
          createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);
      const traversalOrder = [];

      tree.walk(node => void traversalOrder.push(node.data.id), TRAVERSAL_BF);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> B2 -> C1 -> C2 -> C3 -> C4 -> D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 -> D8');
    });

    it('should stop traversing when `false` is returned', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            createNode('D6'),
          ]),
          createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);
      const traversalOrder = [];
      const walker = (node) => {
        traversalOrder.push(node.data.id);

        return node.data.id !== 'C3';
      };

      tree.walk(walker, TRAVERSAL_DF_PRE);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> C1 -> D1 -> C2 -> D2 -> D3 -> D4 -> B2 -> C3');

      traversalOrder.length = 0;
      tree.walk(walker, TRAVERSAL_DF_POST);

      expect(traversalOrder.join(' -> ')).toBe('D1 -> C1 -> D2 -> D3 -> D4 -> C2 -> B1 -> D5 -> D6 -> C3');

      traversalOrder.length = 0;
      tree.walk(walker, TRAVERSAL_BF);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> B2 -> C1 -> C2 -> C3');
    });
  });
});
