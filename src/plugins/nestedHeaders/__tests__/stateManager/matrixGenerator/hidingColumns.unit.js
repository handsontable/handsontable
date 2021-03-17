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
  describe('should build proper headers settings array matrix after hiding columns', () => {
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

      {
        // hide B2
        triggerNodeModification('hide-column', tree.getNode(1, 1), 1);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+
         *  | A1 | B1 | C1 |
         *  +----+----+----+
         *  | A2 | B2 | C2 |
         *  +----+----+----+
         *         |
         *   Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C1' }),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C2' }),
          ],
        ]);
      }
      {
        // hide A2
        triggerNodeModification('hide-column', tree.getNode(1, 0), 0);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+
         *  | A1 | B1 | C1 |
         *  +----+----+----+
         *  | A2 | B2 | C2 |
         *  +----+----+----+
         *    |    |
         *   Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C1' }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C2' }),
          ],
        ]);
      }
      {
        // hide C2
        triggerNodeModification('hide-column', tree.getNode(1, 2), 2);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+
         *  | A1 | B1 | C1 |
         *  +----+----+----+
         *  | A2 | B2 | C2 |
         *  +----+----+----+
         *    |    |    |
         *   Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
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

      {
        // hide C2
        triggerNodeModification('hide-column', tree.getNode(2, 2), 2);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | A1        X       |
         *  +----+----+----+----+
         *  | B1        X  | B2 |
         *  +----+----+----+----+
         *  | C1      | C2 | C3 |
         *  +----+----+----+----+
         *              |
         *      Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'B1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2' }),
          ],
          [
            createRootColspanSettings({ label: 'C1', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3' }),
          ]
        ]);
      }
      {
        // hide C1 at column index 0
        triggerNodeModification('hide-column', tree.getNode(2, 0), 0);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | X    A1   X       |
         *  +----+----+----+----+
         *  | X    B1   X  | B2 |
         *  +----+----+----+----+
         *  | X    C1 | C2 | C3 |
         *  +----+----+----+----+
         *    |         |
         *    Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createRootColspanSettings({ label: 'A1', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2' }),
          ],
          [
            createPlaceholder(),
            createRootColspanSettings({ label: 'C1', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3' }),
          ]
        ]);
      }
      {
        // hide C1 at column index 1
        triggerNodeModification('hide-column', tree.getNode(2, 0), 1);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | X    X    X    A1 |
         *  +----+----+----+----+
         *  | X    B1   X  | B2 |
         *  +----+----+----+----+
         *  | X    C1 | C2 | C3 |
         *  +----+----+----+----+
         *    |    |    |
         *    Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A1', colspan: 1, origColspan: 4 }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2' }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3' }),
          ]
        ]);
      }
      {
        // hide C3 at column index 3
        triggerNodeModification('hide-column', tree.getNode(2, 3), 3);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+
         *  | X    X    X    A1 |
         *  +----+----+----+----+
         *  | X    B1   X  | B2 |
         *  +----+----+----+----+
         *  | X    C1 | C2 | C3 |
         *  +----+----+----+----+
         *    |    |    |    |
         *    Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
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

      {
        // hide D3 at visual column index 2
        triggerNodeModification('hide-column', tree.getNode(3, 2), 2);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2   X                                | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2   X            | B3                | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3      | C4      | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *              |
         *        Hidden columns
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
            createRootColspanSettings({ label: 'B2', colspan: 3, origColspan: 4 }),
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
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3', colspan: 2, origColspan: 3 }),
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
            createPlaceholder(),
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
      {
        // hide D7 at visual column index 6
        triggerNodeModification('hide-column', tree.getNode(3, 6), 6);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | A2   X                   X            | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | B2   X            | B3   X            | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3      | C4   X  | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *              |                   |
         *                 Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createRootColspanSettings({ label: 'A2', colspan: 6, origColspan: 8 }),
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
            createRootColspanSettings({ label: 'B2', colspan: 3, origColspan: 4 }),
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
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createRootColspanSettings({ label: 'D2' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4' }),
            createRootColspanSettings({ label: 'D5' }),
            createRootColspanSettings({ label: 'D6' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9' }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // hide A2 at visual column index 1
        triggerNodeModification('hide-column', tree.getNode(3, 1), 1);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    A2             X            | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | X    X    B2      | B3   X            | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3      | C4   X  | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *         |    |                   |
         *                Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A3' }),
          ],
          [
            createRootColspanSettings({ label: 'B1' }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B4' }),
          ],
          [
            createRootColspanSettings({ label: 'C1' }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C6' }),
          ],
          [
            createRootColspanSettings({ label: 'D1' }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4' }),
            createRootColspanSettings({ label: 'D5' }),
            createRootColspanSettings({ label: 'D6' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9' }),
            createRootColspanSettings({ label: '' }),
          ]
        ]);
      }
      {
        // hide A1 at visual column index 0
        triggerNodeModification('hide-column', tree.getNode(3, 0), 0);
        // hide D10 at visual column index 9
        triggerNodeModification('hide-column', tree.getNode(3, 9), 9);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    A2             X            | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | X    X    B2      | B3   X            | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3      | C4   X  | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *    |    |    |                   |              |
         *                Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4' }),
            createRootColspanSettings({ label: 'D5' }),
            createRootColspanSettings({ label: 'D6' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9' }),
            createPlaceholder(),
          ]
        ]);
      }
      {
        // hide D6 at visual column index 5
        triggerNodeModification('hide-column', tree.getNode(3, 5), 5);
        // hide D5 at visual column index 4
        triggerNodeModification('hide-column', tree.getNode(3, 4), 4);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    A2   X    X    X            | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | X    X    B2   X  | X    X    B3      | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3   X  | C4   X  | C5      | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *    |    |    |         |    |    |              |
         *                Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D8' }),
            createRootColspanSettings({ label: 'D9' }),
            createPlaceholder(),
          ]
        ]);
      }
      {
        // hide D9 at visual column index 8
        triggerNodeModification('hide-column', tree.getNode(3, 8), 8);
        // hide D4 at visual column index 3
        triggerNodeModification('hide-column', tree.getNode(3, 3), 3);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    X    X    X    A2   X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | X    X    B2   X  | X    X    B3   X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3   X  | C4   X  | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |    |    |    |         |    |
         *                Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'A2', colspan: 1, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'C5', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D8' }),
            createPlaceholder(),
            createPlaceholder(),
          ]
        ]);
      }
      {
        // hide D9 at visual column index 7
        triggerNodeModification('hide-column', tree.getNode(3, 7), 7);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    X    X    X    A2   X  | A3 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | B1 | X    X    B2   X  | X    X    B3   X  | B4 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | C1 | C2 | X    C3   X  | C4   X  | C5   X  | C6 |
         *  +----+----+----+----+----+----+----+----+----+----+
         *  | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
         *  +----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |    |    |    |    |    |    |
         *                Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
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

      {
        // hide L4 at visual column index 11
        triggerNodeModification('hide-column', tree.getNode(3, 11), 11);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | B1                                    | J1 | K1   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | B2                                    | J2 | K2   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | B3                | F3                | J3 | K3   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4      | D4      | F4      | H4      | J4 | K4 | X    L4 |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *                                                           |
         *                                                   Hidden columns
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
            createRootColspanSettings({ label: 'K1', colspan: 2, origColspan: 3 }),
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
            createRootColspanSettings({ label: 'K2', colspan: 2, origColspan: 3 }),
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
            createRootColspanSettings({ label: 'K3', colspan: 2, origColspan: 3 }),
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
            createPlaceholder(),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2 }),
          ],
        ]);
      }
      {
        // hide B4 at visual column index 2
        triggerNodeModification('hide-column', tree.getNode(3, 2), 2);
        // hide B4 at visual column index 1
        triggerNodeModification('hide-column', tree.getNode(3, 1), 1);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    B1                          | J1 | K1   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    B2                          | J2 | K2   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    B3      | F3                | J3 | K3   X       |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | D4      | F4      | H4      | J4 | K4 | X    L4 |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *         |    |                                            |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 6, origColspan: 8 }),
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
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 6, origColspan: 8 }),
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
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 4, origColspan: 4 }),
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
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'L4', colspan: 1, origColspan: 2 }),
          ],
        ]);
      }
      {
        // hide D4 at visual column index 3
        triggerNodeModification('hide-column', tree.getNode(3, 3), 3);
        // hide L4 at visual column index 12
        triggerNodeModification('hide-column', tree.getNode(3, 11), 12);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    B1                     | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    B2                     | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | F3                | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | F4      | H4      | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *         |    |    |                                       |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4 }),
            createRootColspanSettings({ label: 'F3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2 }),
            createRootColspanSettings({ label: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // hide F4 at visual column index 5
        triggerNodeModification('hide-column', tree.getNode(3, 5), 5);
        // hide H4 at visual column index 8
        triggerNodeModification('hide-column', tree.getNode(3, 7), 8);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    B1   X              X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    B2   X              X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | X    F3        X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | X    F4 | H4   X  | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *         |    |    |         |              |              |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createRootColspanSettings({ label: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createRootColspanSettings({ label: 'K1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createRootColspanSettings({ label: 'K2', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createRootColspanSettings({ label: 'K3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createRootColspanSettings({ label: 'A4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2 }),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createRootColspanSettings({ label: 'K4' }),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // hide A4 at visual column index 0
        triggerNodeModification('hide-column', tree.getNode(3, 0), 0);
        // hide K4 at visual column index 10
        triggerNodeModification('hide-column', tree.getNode(3, 10), 10);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    B1   X              X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    B2   X              X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | X    F3        X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | X    F4 | H4   X  | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |         |              |         |    |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'D4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F4', colspan: 1, origColspan: 2 }),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // hide F4 at visual column index 6
        triggerNodeModification('hide-column', tree.getNode(3, 5), 6);
        // hide D4 at visual column index 10
        triggerNodeModification('hide-column', tree.getNode(3, 3), 4);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    X    X    X    B1   X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    X    X    X    B2   X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | X    X    F3   X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | X    F4 | H4   X  | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |    |    |    |         |         |    |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B1', colspan: 1, origColspan: 8 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'B2', colspan: 1, origColspan: 8 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'F3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // hide H4 at visual column index 7
        triggerNodeModification('hide-column', tree.getNode(3, 7), 7);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    X    X    X    B1   X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    X    X    X    B2   X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | X    X    F3   X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | X    F4 | H4   X  | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |    |    |    |    |    |         |    |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createRootColspanSettings({ label: 'J4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
      {
        // hide J4 at visual column index 9
        triggerNodeModification('hide-column', tree.getNode(3, 9), 9);

        const matrix = generateMatrixFromTree(tree);

        /**
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A1 | X    X    X    X    X    X    B1   X  | J1 | K1   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A2 | X    X    X    X    X    X    B2   X  | J2 | K2   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A3 | X    X    X    B3 | X    X    F3   X  | J3 | K3   X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *  | A4 | B4   X  | X    D4 | X    F4 | H4   X  | J4 | K4 | X    X  |
         *  +----+----+----+----+----+----+----+----+----+----+----+----+----+
         *    |    |    |    |    |    |    |    |    |    |    |    |    |
         *                           Hidden columns
         */
        expect(matrix).toEqual([
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
        ]);
      }
    });
  });
});
