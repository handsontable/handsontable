import { TRAVERSAL_DF_POST } from 'handsontable/utils/dataStructures/tree';
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { generateMatrix } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';
import { triggerNodeModification } from 'handsontable/plugins/nestedHeaders/stateManager/nodeModifiers';

function createRootColspanSettings(overwriteProps = {}) {
  return {
    label: '',
    colspan: 1,
    origColspan: 1,
    isHidden: false,
    isCollapsed: false,
    collapsible: false,
    isRoot: true,
    isPlaceholder: false,
    ...overwriteProps,
  };
}

function createPlaceholder() {
  return {
    label: '',
    isPlaceholder: true,
  };
}

function createTree(nestedHeadersSettings) {
  const source = new SourceSettings();

  source.setData(nestedHeadersSettings);

  return new HeadersTree(source);
}

function generateMatrixFromTree(tree) {
  return generateMatrix(tree.getRoots());
}

describe('generateMatrix', () => {
  describe('should build proper headers settings array matrix after node expanding', () => {
    it('no nested headers defined', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +----+----+----+
       *   | A2 | B2 | C2 |
       *   +----+----+----+
       */
      const tree = createTree([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      // Try to expand B1 node
      triggerNodeModification('expand', tree.getNode(0, 1));

      expect(matrix).toEqual([
        [
          createRootColspanSettings({ label: 'A1' }),
          createRootColspanSettings({ label: 'B1' }),
          createRootColspanSettings({ label: 'C1' }),
        ],
        [
          createRootColspanSettings({ label: 'A2' }),
          createRootColspanSettings({ label: 'B2' }),
          createRootColspanSettings({ label: 'C2' }),
        ],
      ]);
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

      // Collapse all nodes.
      tree.getRoots().forEach((rootNode) => {
        rootNode.walkDown((node) => {
          if (node.data.origColspan > 1) {
            triggerNodeModification('collapse', node);
          }
        }, TRAVERSAL_DF_POST);
      });

      {
        // expand B1
        triggerNodeModification('expand', tree.getNode(1, 0));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | A1   X         X  |
         *  +----+----+----+----+
         *  | B1   X       | B2 |
         *  +----+----+----+----+
         *  | C1   X  | C2 | C3 |
         *  +----+----+----+----+
         *         |         |
         *     Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'B1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', isHidden: true }),
          ],
          [
            createRootColspanSettings({ label: 'C1', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', isHidden: true }),
          ]
        ]);
      }
      {
        // expand C1
        triggerNodeModification('expand', tree.getNode(2, 0));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | A1             X  |
         *  +----+----+----+----+
         *  | B1           | B2 |
         *  +----+----+----+----+
         *  | C1      | C2 | C3 |
         *  +----+----+----+----+
         *                   |
         *          Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1', colspan: 3, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'B1', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', isHidden: true }),
          ],
          [
            createRootColspanSettings({ label: 'C1', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', isHidden: true }),
          ]
        ]);
      }
      {
        // expand A1
        triggerNodeModification('expand', tree.getNode(0, 0));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | A1                |
         *  +----+----+----+----+
         *  | B1           | B2 |
         *  +----+----+----+----+
         *  | C1      | C2 | C3 |
         *  +----+----+----+----+
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'B1', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2' }),
          ],
          [
            createRootColspanSettings({ label: 'C1', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3' }),
          ]
        ]);
      }
    });

    it('nested headers defined without overlapping columns (variation #2)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                                    | A3 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2                | B3                | B4 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      | C5      | C6 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ]);

      tree.buildTree();

      // Collapse all nodes.
      tree.getRoots().forEach((rootNode) => {
        rootNode.walkDown((node) => {
          if (node.data.origColspan > 1) {
            triggerNodeModification('collapse', node);
          }
        }, TRAVERSAL_DF_POST);
      });

      {
        // expand B2
        triggerNodeModification('expand', tree.getNode(1, 1));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2        X    X    X    X    X    X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2        X    X  | B3   X    X    X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3   X    X  | C4   X  | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *                   |    |    |    |    |    |
         *                     Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 2, origColspan: 8, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4', isHidden: true }),
            createRootColspanSettings({ label: 'D5', isHidden: true }),
            createRootColspanSettings({ label: 'D6', isHidden: true }),
            createRootColspanSettings({ label: 'D7', isHidden: true }),
            createRootColspanSettings({ label: 'D8', isHidden: true }),
            createRootColspanSettings({ label: 'D9', isHidden: true }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // expand A2
        triggerNodeModification('expand', tree.getNode(0, 1));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2        X    X         X    X    X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2        X    X  | B3   X    X    X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3   X    X  | C4   X  | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *                   |    |         |    |    |
         *                     Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4', isHidden: true }),
            createRootColspanSettings({ label: 'D5', isHidden: true }),
            createRootColspanSettings({ label: 'D6' }),
            createRootColspanSettings({ label: 'D7', isHidden: true }),
            createRootColspanSettings({ label: 'D8', isHidden: true }),
            createRootColspanSettings({ label: 'D9', isHidden: true }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // expand C4
        triggerNodeModification('expand', tree.getNode(2, 5));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2        X    X              X    X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2        X    X  | B3        X    X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3   X    X  | C4      | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *                   |    |              |    |
         *                     Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 4, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4', isHidden: true }),
            createRootColspanSettings({ label: 'D5', isHidden: true }),
            createRootColspanSettings({ label: 'D6' }),
            createRootColspanSettings({ label: 'D7' }),
            createRootColspanSettings({ label: 'D8', isHidden: true }),
            createRootColspanSettings({ label: 'D9', isHidden: true }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // expand B3
        triggerNodeModification('expand', tree.getNode(1, 5));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2        X    X                   X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2        X    X  | B3             X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3   X    X  | C4      | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *                   |    |                   |
         *                     Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4', isHidden: true }),
            createRootColspanSettings({ label: 'D5', isHidden: true }),
            createRootColspanSettings({ label: 'D6' }),
            createRootColspanSettings({ label: 'D7' }),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9', isHidden: true }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // expand C3
        triggerNodeModification('expand', tree.getNode(2, 2));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2                                 X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2                | B3             X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3           | C4      | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *                                            |
         *                                  Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 7, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4' }),
            createRootColspanSettings({ label: 'D5' }),
            createRootColspanSettings({ label: 'D6' }),
            createRootColspanSettings({ label: 'D7' }),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9', isHidden: true }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // expand C5
        triggerNodeModification('expand', tree.getNode(2, 7));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2                                    | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2                | B3                | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | C3           | C4      | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 8, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createRootColspanSettings({ label: 'B2', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createRootColspanSettings({ label: 'C2' }),
            createRootColspanSettings({ label: 'C3', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createRootColspanSettings({ label: 'D3' }),
            createRootColspanSettings({ label: 'D4' }),
            createRootColspanSettings({ label: 'D5' }),
            createRootColspanSettings({ label: 'D6' }),
            createRootColspanSettings({ label: 'D7' }),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9' }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
    });

    it('nested headers defined without overlapping columns (variation #3, advanced example, with "mirrored" headers)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                    | J1 | K1           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                                    | J2 | K2           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3                | F3                | J3 | K3           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4      | D4      | F4      | H4      | J4 | K4 | L4      |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
        ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
        ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
        ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
          { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
      ]);

      tree.buildTree();

      // Collapse all nodes.
      tree.getRoots().forEach((rootNode) => {
        rootNode.walkDown((node) => {
          if (node.data.origColspan > 1) {
            triggerNodeModification('collapse', node);
          }
        }, TRAVERSAL_DF_POST);
      });

      {
        // expand B2
        triggerNodeModification('expand', tree.getNode(1, 1));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1   X    X    X         X    X    X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2   X    X    X         X    X    X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3   X    X    X  | F3   X    X    X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | D4   X  | F4   X  | H4   X  | J4 | K4 | L4   X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *              |    |    |         |    |    |              |    |
         *                       Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 2, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 1, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand F3
        triggerNodeModification('expand', tree.getNode(2, 5));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1   X    X    X         X         X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2   X    X    X         X         X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3   X    X    X  | F3   X         X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | D4   X  | F4   X  | H4   X  | J4 | K4 | L4   X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *              |    |    |         |         |              |    |
         *                       Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand B4
        triggerNodeModification('expand', tree.getNode(3, 1));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1        X    X         X         X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2        X    X         X         X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3        X    X  | F3   X         X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4   X  | F4   X  | H4   X  | J4 | K4 | L4   X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                   |    |         |         |              |    |
         *                       Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 4, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 4, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 1, origColspan: 3, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand K2
        triggerNodeModification('expand', tree.getNode(1, 10));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1        X    X         X         X  | J1 | K1        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2        X    X         X         X  | J2 | K2        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3        X    X  | F3   X         X  | J3 | K3        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4   X  | F4   X  | H4   X  | J4 | K4 | L4   X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                   |    |         |         |                   |
         *                             Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 4, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 4, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand H4
        triggerNodeModification('expand', tree.getNode(3, 7));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1        X    X         X            | J1 | K1        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2        X    X         X            | J2 | K2        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3        X    X  | F3   X            | J3 | K3        X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4   X  | F4   X  | H4      | J4 | K4 | L4   X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                   |    |         |                             |
         *                             Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand L4
        triggerNodeModification('expand', tree.getNode(3, 11));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1        X    X         X            | J1 | K1           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2        X    X         X            | J2 | K2           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3        X    X  | F3   X            | J3 | K3           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4   X  | F4   X  | H4      | J4 | K4 | L4      |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                   |    |         |
         *                Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4, isCollapsed: true }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2, isCollapsed: true, isHidden: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand B3
        triggerNodeModification('expand', tree.getNode(2, 1));
        // expand D4
        triggerNodeModification('expand', tree.getNode(3, 3));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1                       X            | J1 | K1           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2                       X            | J2 | K2           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3                | F3   X            | J3 | K3           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4      | F4   X  | H4      | J4 | K4 | L4      |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                                  |
         *                           Non-renderable columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 7, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 7, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2, isCollapsed: true }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // expand F4
        triggerNodeModification('expand', tree.getNode(3, 5));

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1                                    | J1 | K1           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2                                    | J2 | K2           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3                | F3                | J3 | K3           |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4      | F4      | H4      | J4 | K4 | L4      |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'B1', colspan: 8, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createRootColspanSettings({ label: 'B2', colspan: 8, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createRootColspanSettings({ label: 'B3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 3, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createRootColspanSettings({ label: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createRootColspanSettings({ label: 'L4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
          ],
        ]);
      }
    });
  });
});
