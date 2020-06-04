import TreeNode, { TRAVERSAL_DF_PRE, TRAVERSAL_DF_POST, TRAVERSAL_BF } from 'handsontable/utils/dataStructures/tree';

function createNode(id, childs = []) {
  const node = new TreeNode({ id });

  childs.forEach((childNode) => {
    node.addChild(childNode);
  });

  return node;
}

describe('TreeNode', () => {
  it('should construct properly', () => {
    const node = createNode('test');

    expect(node.data.id).toBe('test');
    expect(node.childs).toEqual([]);
    expect(node.parent).toBeNull();
  });

  describe('addChild()', () => {
    it('should add a node as child and link itself as a parent', () => {
      const node = createNode('parent');
      const nodeChild = createNode('child');

      node.addChild(nodeChild);

      expect(node.childs.length).toBe(1);
      expect(node.childs[0]).toBe(nodeChild);
      expect(node.childs[0].parent).toBe(node);
    });
  });

  describe('cloneTree()', () => {
    it('should clone a tree deeply (with its childs) - cloning a root node', () => {
      /**
       * Tree structure:
       *      .--(B1)--.
       *   .-(C1)   .-(C2)-.----.
       *  (D1)     (D2)   (D3) (D4)
       */
      const nodes = {};
      const tree = createNode('B1', [
        nodes.c1 = createNode('C1', [
          nodes.d1 = createNode('D1'),
        ]),
        nodes.c2 = createNode('C2', [
          nodes.d2 = createNode('D2'),
          nodes.d3 = createNode('D3'),
          nodes.d4 = createNode('D4'),
        ]),
      ]);

      const clonedTree = tree.cloneTree();

      // Check if the references were break.
      expect(clonedTree).not.toBe(tree);
      expect(clonedTree.childs[0]).not.toBe(nodes.c1);
      expect(clonedTree.childs[0].childs[0]).not.toBe(nodes.d1);
      expect(clonedTree.childs[1]).not.toBe(nodes.c2);
      expect(clonedTree.childs[1].childs[0]).not.toBe(nodes.d2);
      expect(clonedTree.childs[1].childs[1]).not.toBe(nodes.d3);
      expect(clonedTree.childs[1].childs[2]).not.toBe(nodes.d4);

      // Check if the cloned nodes cloned nodes data.
      expect(clonedTree.data).not.toBe(tree.data);
      expect(clonedTree.data).toEqual(tree.data);
      expect(clonedTree.childs[1].data).not.toBe(nodes.c2.data);
      expect(clonedTree.childs[1].data).toEqual(nodes.c2.data);
    });

    it('should clone a tree deeply (with its childs) - cloning a node from the middle of the tree', () => {
      /**
       * Tree structure:
       *      .--(B1)--.
       *   .-(C1)   .-(C2)-.----.
       *  (D1)     (D2)   (D3) (D4)
       */
      const nodes = {};
      const tree = createNode('B1', [
        nodes.c1 = createNode('C1', [
          nodes.d1 = createNode('D1'),
        ]),
        nodes.c2 = createNode('C2', [
          nodes.d2 = createNode('D2'),
          nodes.d3 = createNode('D3'),
          nodes.d4 = createNode('D4'),
        ]),
      ]);

      const clonedTree = nodes.c2.cloneTree();

      // Check if the references were break.
      expect(clonedTree).not.toBe(tree);
      expect(clonedTree.childs[0]).not.toBe(nodes.d2);
      expect(clonedTree.childs[1]).not.toBe(nodes.d3);
      expect(clonedTree.childs[2]).not.toBe(nodes.d4);

      expect(clonedTree.parent).toBe(null);

      // Check if the cloned nodes cloned nodes data.
      expect(clonedTree.data).not.toBe(tree.data);
      expect(clonedTree.data).toEqual(nodes.c2.data);
      expect(clonedTree.childs[1].data).not.toBe(nodes.d3.data);
      expect(clonedTree.childs[1].data).toEqual(nodes.d3.data);
    });
  });

  describe('replaceTreeWith()', () => {
    it('should replace a tree node with cloned nodes (a tree overwrite example)', () => {
      /**
       * Tree structure:
       *      .--(B1)--.
       *   .-(C1)   .-(C2)-.----.
       *  (D1)     (D2)   (D3) (D4)
       */
      const nodes = {};

      createNode('B1', [
        nodes.c1 = createNode('C1', [
          nodes.d1 = createNode('D1'),
        ]),
        nodes.c2 = createNode('C2', [
          nodes.d2 = createNode('D2'),
          nodes.d3 = createNode('D3'),
          nodes.d4 = createNode('D4'),
        ]),
      ]);

      const clonedTree = nodes.c2.cloneTree();

      clonedTree.walkDown(({ data }) => {
        data.test = `${data.id}_test`;
      });

      nodes.c2.replaceTreeWith(clonedTree);

      // Check if the references were break.
      expect(nodes.c2.data).toEqual(clonedTree.data);
      expect(nodes.c2.childs[0]).not.toBe(nodes.d2);
      expect(nodes.c2.childs[0].data).not.toBe(nodes.d2.data);
      expect(nodes.c2.childs[0].data.test).toBe('D2_test');
      expect(nodes.c2.childs[1]).not.toBe(nodes.d3);
      expect(nodes.c2.childs[1].data).not.toBe(nodes.d3.data);
      expect(nodes.c2.childs[1].data.test).toBe('D3_test');
      expect(nodes.c2.childs[2]).not.toBe(nodes.d4);
      expect(nodes.c2.childs[2].data).not.toBe(nodes.d4.data);
      expect(nodes.c2.childs[2].data.test).toBe('D4_test');
    });

    it('should replace a tree node with cloned nodes (a tree replacing example)', () => {
      /**
       * Tree structure:
       *      .--(B1)--.
       *   .-(C1)   .-(C2)-.----.
       *  (D1)     (D2)   (D3) (D4)
       */
      const nodes = {};

      createNode('B1', [
        nodes.c1 = createNode('C1', [
          nodes.d1 = createNode('D1'),
        ]),
        nodes.c2 = createNode('C2', [
          nodes.d2 = createNode('D2'),
          nodes.d3 = createNode('D3'),
          nodes.d4 = createNode('D4'),
        ]),
      ]);

      const clonedTree = nodes.c2.cloneTree();

      clonedTree.walkDown(({ data }) => {
        data.id = `${data.id}\``;
      });
      /**
       * Tree structure after replacing:
       *      .--(B1)--.
       *   .-(C1)   .-(C2)-.-----.
       *  (D1)     (D2) .-(C2`) (D4)
       *                |
       *           .-------.-----.
       *          (D2`)   (D3`) (D4`)
       */
      nodes.d3.replaceTreeWith(clonedTree);

      // Check if the references were break.
      expect(nodes.d3.data).toEqual({ id: 'C2`' });
      expect(nodes.d3.childs.length).toBe(3);
      expect(nodes.d3.childs[0].data).toEqual({ id: 'D2`' });
      expect(nodes.d3.childs[1].data).toEqual({ id: 'D3`' });
      expect(nodes.d3.childs[2].data).toEqual({ id: 'D4`' });
    });
  });

  describe('walkDown()', () => {
    it('should properly traverse a tree using default startegy (breadth first)', () => {
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

      tree.walkDown(node => void traversalOrder.push(node.data.id));

      expect(traversalOrder.join(' -> '))
        .toBe('A1 -> B1 -> B2 -> C1 -> C2 -> C3 -> C4 -> D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 -> D8');
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

      tree.walkDown(node => void traversalOrder.push(node.data.id), TRAVERSAL_DF_PRE);

      expect(traversalOrder.join(' -> '))
        .toBe('A1 -> B1 -> C1 -> D1 -> C2 -> D2 -> D3 -> D4 -> B2 -> C3 -> D5 -> D6 -> C4 -> D7 -> D8');
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

      tree.walkDown(node => void traversalOrder.push(node.data.id), TRAVERSAL_DF_POST);

      expect(traversalOrder.join(' -> '))
        .toBe('D1 -> C1 -> D2 -> D3 -> D4 -> C2 -> B1 -> D5 -> D6 -> C3 -> D7 -> D8 -> C4 -> B2 -> A1');
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

      tree.walkDown(node => void traversalOrder.push(node.data.id), TRAVERSAL_BF);

      expect(traversalOrder.join(' -> '))
        .toBe('A1 -> B1 -> B2 -> C1 -> C2 -> C3 -> C4 -> D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 -> D8');
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

      tree.walkDown(walker, TRAVERSAL_DF_PRE);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> C1 -> D1 -> C2 -> D2 -> D3 -> D4 -> B2 -> C3');

      traversalOrder.length = 0;
      tree.walkDown(walker, TRAVERSAL_DF_POST);

      expect(traversalOrder.join(' -> ')).toBe('D1 -> C1 -> D2 -> D3 -> D4 -> C2 -> B1 -> D5 -> D6 -> C3');

      traversalOrder.length = 0;
      tree.walkDown(walker, TRAVERSAL_BF);

      expect(traversalOrder.join(' -> ')).toBe('A1 -> B1 -> B2 -> C1 -> C2 -> C3');
    });
  });

  describe('walkUp()', () => {
    it('should properly traverse a tree', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const nodes = {};
      const tree = createNode('A1', [
        createNode('B1', [
          nodes.c1 = createNode('C1', [
            nodes.d1 = createNode('D1'),
          ]),
          createNode('C2', [
            nodes.d2 = createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            nodes.d6 = createNode('D6'),
          ]),
          nodes.c4 = createNode('C4', [
            createNode('D7'),
            createNode('D8'),
          ]),
        ]),
      ]);

      {
        const traversalOrder = [];

        tree.walkUp(node => void traversalOrder.push(node.data.id));

        expect(traversalOrder.join(' -> ')).toBe('A1');
      }
      {
        const traversalOrder = [];

        nodes.c1.walkUp(node => void traversalOrder.push(node.data.id));

        expect(traversalOrder.join(' -> ')).toBe('C1 -> B1 -> A1');
      }
      {
        const traversalOrder = [];

        nodes.d1.walkUp(node => void traversalOrder.push(node.data.id));

        expect(traversalOrder.join(' -> ')).toBe('D1 -> C1 -> B1 -> A1');
      }
      {
        const traversalOrder = [];

        nodes.d6.walkUp(node => void traversalOrder.push(node.data.id));

        expect(traversalOrder.join(' -> ')).toBe('D6 -> C3 -> B2 -> A1');
      }
      {
        const traversalOrder = [];

        nodes.c4.walkUp(node => void traversalOrder.push(node.data.id));

        expect(traversalOrder.join(' -> ')).toBe('C4 -> B2 -> A1');
      }
    });

    it('should stop traversing when `false` is returned', () => {
      /**
       * Tree structure:
       *          .---------------(A1)--------------.
       *      .--(B1)--.                        .--(B2)--------.
       *   .-(C1)   .-(C2)-.----.         .----(C3)--.     .--(C4)--.
       *  (D1)     (D2)   (D3) (D4)      (D5)       (D6)  (D7)     (D8)
       */
      const nodes = {};
      const tree = createNode('A1', [
        createNode('B1', [
          createNode('C1', [
            createNode('D1'),
          ]),
          createNode('C2', [
            nodes.d2 = createNode('D2'),
            createNode('D3'),
            createNode('D4'),
          ]),
        ]),
        nodes.b2 = createNode('B2', [
          createNode('C3', [
            createNode('D5'),
            nodes.d6 = createNode('D6'),
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

        return node.data.id !== 'B2';
      };

      tree.walkUp(walker);

      expect(traversalOrder.join(' -> ')).toBe('A1');

      traversalOrder.length = 0;
      nodes.d6.walkUp(walker);

      expect(traversalOrder.join(' -> ')).toBe('D6 -> C3 -> B2');

      traversalOrder.length = 0;
      nodes.b2.walkUp(walker);

      expect(traversalOrder.join(' -> ')).toBe('B2');

      traversalOrder.length = 0;
      nodes.d2.walkUp(walker);

      expect(traversalOrder.join(' -> ')).toBe('D2 -> C2 -> B1 -> A1');
    });
  });
});
