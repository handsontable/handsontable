import HeadersTree from 'handsontable/plugins/nestedHeaders/columnStatesManager/headersTree';
import SettingsNormalizer from 'handsontable/plugins/nestedHeaders/columnStatesManager/settingsNormalizer';

function createTree(nestedHeadersSettings) {
  return new HeadersTree(new SettingsNormalizer(nestedHeadersSettings));
}

describe('HeadersTree', () => {
  describe('should build a tree properly', () => {
    it('no nested headers defined', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +----+----+----+
       */
      const tree = createTree([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ]);

      tree.buildTree();

      /**
       * Tree structure:
       *   (A1)--.
       *        (A2)
       */
      {
        const root = tree.rootNodes.get(0);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'A1',
          colspan: 1,
        }));
        expect(root.childs.length).toBe(1);

        const childs = root.childs; // tree depth 1

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'A2',
          colspan: 1,
        }));
        expect(childs[0].childs.length).toBe(0);
      }
      /**
       * Tree structure:
       *   (B1)--.
       *        (B2)
       */
      {
        const root = tree.rootNodes.get(1);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'B1',
          colspan: 1,
        }));
        expect(root.childs.length).toBe(1);

        const childs = root.childs; // tree depth 1

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'B2',
          colspan: 1,
        }));
        expect(childs[0].childs.length).toBe(0);
      }
      /**
       * Tree structure:
       *   (C1)--.
       *        (C2)
       */
      {
        const root = tree.rootNodes.get(2);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'C1',
          colspan: 1,
        }));
        expect(root.childs.length).toBe(1);

        const childs = root.childs; // tree depth 1

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'C2',
          colspan: 1,
        }));
        expect(childs[0].childs.length).toBe(0);
      }
    });

    it('nested headers defined without overlapping columns (variation #1)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+
       *   | A1                |
       *   +----+----+----+----+
       *   | B1           | B2 |
       *   +----+----+----+----+
       *   | C1      | C2 | C3 |
       *   +----+----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', colspan: 4 }],
        [{ label: 'B1', colspan: 3 }, 'B2'],
        [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
      ]);

      tree.buildTree();

      /**
       * Tree structure:
       *        .------(A1)------.
       *   .--(B1)--.           (B2)--.
       *  (C1)     (C2)              (C3)
       */
      {
        const root = tree.rootNodes.get(0);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'A1',
          colspan: 4,
        }));
        expect(root.childs.length).toBe(2);

        const childs = root.childs; // tree depth 1

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'B1',
          colspan: 3,
        }));
        expect(childs[1].data).toEqual(expect.objectContaining({
          label: 'B2',
          colspan: 1,
        }));
        expect(childs.length).toBe(2);

        // tree depth 2 (the left leaf)
        const childs2left = root.childs[0].childs;

        expect(childs2left[0].data).toEqual(expect.objectContaining({
          label: 'C1',
          colspan: 2,
        }));
        expect(childs2left[1].data).toEqual(expect.objectContaining({
          label: 'C2',
          colspan: 1,
        }));
        expect(childs2left.length).toBe(2);
        // tree depth 2 (the right leaf)
        const childs2right = root.childs[1].childs;

        expect(childs2right[0].data).toEqual(expect.objectContaining({
          label: 'C3',
          colspan: 1,
        }));
        expect(childs2right.length).toBe(1);
      }
    });

    it('nested headers defined without overlapping columns (variation #2)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+
       *   | A1                |
       *   +----+----+----+----+
       *   | B1           | B2 |
       *   +----+----+----+----+
       *   | C1      | C2 | C3 |
       *   +----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ]);

      tree.buildTree();

      /**
       * Tree structure:
       *     0                                             1                                      9
       *     |                                             |                                      |
       *   (A1)-.                         .---------------(A2)--------------.                    (A3)-.
       *       (B1)-.                 .--(B2)--.                        .--(B3)--------.             (B4)-.
       *           (C1)-.          .-(C2)   .-(C3)-.----.         .----(C4)--.     .--(C5)--.            (C6)-.
       *               (D1)       (D2)     (D3)   (D4) (D5)      (D6)       (D7)  (D8)     (D9)              ( )
       */
      {
        const root = tree.rootNodes.get(0);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'A1',
          colspan: 1,
        }));
        expect(root.childs.length).toBe(1);

        // tree depth 1
        let childs = root.childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'B1',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 2
        childs = childs[0].childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'C1',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 3
        childs = childs[0].childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'D1',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 4
        childs = childs[0].childs;

        expect(childs.length).toBe(0);
      }
      {
        const root = tree.rootNodes.get(1);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'A2',
          colspan: 8,
        }));
        expect(root.childs.length).toBe(2);

        // tree depth 1
        const childs = root.childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'B2',
          colspan: 4,
        }));
        expect(childs[1].data).toEqual(expect.objectContaining({
          label: 'B3',
          colspan: 4,
        }));
        expect(childs.length).toBe(2);

        // tree depth 2 (left-left leaf)
        const childs2Left = root.childs[0].childs; // B2

        expect(childs2Left[0].data).toEqual(expect.objectContaining({
          label: 'C2',
          colspan: 1,
        }));
        expect(childs2Left[1].data).toEqual(expect.objectContaining({
          label: 'C3',
          colspan: 3,
        }));
        expect(childs2Left.length).toBe(2);

        // tree depth 2 (right leaf)
        const childs2Right = root.childs[1].childs; // B3

        expect(childs2Right[0].data).toEqual(expect.objectContaining({
          label: 'C4',
          colspan: 2,
        }));
        expect(childs2Right[1].data).toEqual(expect.objectContaining({
          label: 'C5',
          colspan: 2,
        }));
        expect(childs2Right.length).toBe(2);

        // tree depth 3 (left-left leaf)
        const childs3LeftLeft = root.childs[0].childs[0].childs; // C2

        expect(childs3LeftLeft[0].data).toEqual(expect.objectContaining({
          label: 'D2',
          colspan: 1,
        }));
        expect(childs3LeftLeft.length).toBe(1);

        // tree depth 3 (left-right leaf)
        const childs3LeftRight = root.childs[0].childs[1].childs; // C3

        expect(childs3LeftRight[0].data).toEqual(expect.objectContaining({
          label: 'D3',
          colspan: 1,
        }));
        expect(childs3LeftRight[1].data).toEqual(expect.objectContaining({
          label: 'D4',
          colspan: 1,
        }));
        expect(childs3LeftRight[2].data).toEqual(expect.objectContaining({
          label: 'D5',
          colspan: 1,
        }));
        expect(childs3LeftRight.length).toBe(3);

        // tree depth 3 (right-left leaf)
        const childs3RightLeft = root.childs[1].childs[0].childs; // C4

        expect(childs3RightLeft[0].data).toEqual(expect.objectContaining({
          label: 'D6',
          colspan: 1,
        }));
        expect(childs3RightLeft[1].data).toEqual(expect.objectContaining({
          label: 'D7',
          colspan: 1,
        }));
        expect(childs3RightLeft.length).toBe(2);

        // tree depth 3 (right-right leaf)
        const childs3RightRight = root.childs[1].childs[1].childs; // C5

        expect(childs3RightRight[0].data).toEqual(expect.objectContaining({
          label: 'D8',
          colspan: 1,
        }));
        expect(childs3RightRight[1].data).toEqual(expect.objectContaining({
          label: 'D9',
          colspan: 1,
        }));
        expect(childs3RightRight.length).toBe(2);
      }
      {
        const root = tree.rootNodes.get(9);

        expect(root.data).toEqual(expect.objectContaining({
          label: 'A3',
          colspan: 1,
        }));
        expect(root.childs.length).toBe(1);

        // tree depth 1
        let childs = root.childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'B4',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 2
        childs = childs[0].childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: 'C6',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 3
        childs = childs[0].childs;

        expect(childs[0].data).toEqual(expect.objectContaining({
          label: '',
          colspan: 1,
        }));
        expect(childs.length).toBe(1);

        // tree depth 4
        childs = childs[0].childs;

        expect(childs.length).toBe(0);
      }
    });

    it('nested headers defined with overlapping columns', () => {
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | A0 | B0 | C0 |    |
         *   +----+----+----+----+
         *   | A1                |
         *   +----+----+----+----+
         *   | B1           | B2 |
         *   +----+----+----+----+
         *   | C1      | C2 | C3 |
         *   +----+----+----+----+
         */
        const tree = createTree([
          ['A0', 'B0', 'C0'],
          [{ label: 'A1', colspan: 4 }],
          [{ label: 'B1', colspan: 3 }, 'B2'],
          [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | 90                |
         *   +----+----+----+----+
         *   | A0 | B0 | C0 |    |
         *   +----+----+----+----+
         *   | A1                |
         *   +----+----+----+----+
         *   |    |    |    |    |
         *   +----+----+----+----+
         */
        const tree = createTree([
          [{ label: '90', colspan: 4 }],
          ['A0', 'B0', 'C0'],
          [{ label: 'A1', colspan: 4 }],
          [],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | A1           | A2 |
         *   +----+----+----+----+
         *   | B1                |
         *   +----+----+----+----+
         */
        const tree = createTree([
          [{ label: 'A1', colspan: 3 }, 'A2'],
          [{ label: 'B1', colspan: 4 }],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | A1 | A2           |
         *   +----+----+----+----+
         *   | B1                |
         *   +----+----+----+----+
         */
        const tree = createTree([
          ['A1', { label: 'A2', colspan: 3 }],
          [{ label: 'B1', colspan: 4 }],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | A1 | A2           |
         *   +----+----+----+----+
         *   | B1 | B2      | B3 |
         *   +----+----+----+----+
         *   | C1      | C2 | C3 |
         *   +----+----+----+----+
         */
        const tree = createTree([
          ['A1', { label: 'A2', colspan: 3 }],
          ['B1', { label: 'B2', colspan: 2 }, 'B3'],
          [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
      {
        /**
         * The column headers visualisation:
         *   +----+----+----+----+
         *   | A1 | A2           |
         *   +----+----+----+----+
         *   | B1 | B2      | B3 |
         *   +----+----+----+----+
         *   | C1 | C2 | C3      |
         *   +----+----+----+----+
         */
        const tree = createTree([
          ['A1', { label: 'A2', colspan: 3 }],
          ['B1', { label: 'B2', colspan: 2 }, 'B3'],
          ['C1', 'C2', { label: 'C3', colspan: 2 }],
        ]);

        expect(() => {
          tree.buildTree();
        }).toThrowError();
      }
    });
  });
});
