import {
  createColspanSettings,
  createPlaceholder,
} from 'handsontable/plugins/nestedHeaders/__tests__/helpers';
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { generateMatrix } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';
import { triggerNodeModification } from 'handsontable/plugins/nestedHeaders/stateManager/nodeModifiers';

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
        // hide B2 at visual column 1
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
            createColspanSettings({ l: 'A1' }),
            createPlaceholder(),
            createColspanSettings({ l: 'C1' }),
          ],
          [
            createColspanSettings({ l: 'A2' }),
            createPlaceholder(),
            createColspanSettings({ l: 'C2' }),
          ],
        ]);
      }
      {
        // hide A2 at visual column 0
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
            createColspanSettings({ l: 'C1' }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C2' }),
          ],
        ]);
      }
      {
        // hide C2 at visual column 2
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
        // hide C2 at visual column 2
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
            createColspanSettings({ l: 'A1', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'B1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2' }),
          ],
          [
            createColspanSettings({ l: 'C1', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C3' }),
          ]
        ]);
      }
      {
        // hide C1 at visual column index 0
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
            createColspanSettings({ l: 'A1', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createColspanSettings({ l: 'B1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createColspanSettings({ l: 'B2' }),
          ],
          [
            createPlaceholder(),
            createColspanSettings({ l: 'C1', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C3' }),
          ]
        ]);
      }
      {
        // hide C1 at visual column index 1
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
            createColspanSettings({ l: 'A1', colspan: 1, origColspan: 4 }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2' }),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C3' }),
          ]
        ]);
      }
      {
        // hide C3 at visual column index 3
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
            createColspanSettings({ l: 'A1' }),
            createColspanSettings({ l: 'A2', colspan: 7, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'A3' }),
          ],
          [
            createColspanSettings({ l: 'B1' }),
            createColspanSettings({ l: 'B2', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B4' }),
          ],
          [
            createColspanSettings({ l: 'C1' }),
            createColspanSettings({ l: 'C2' }),
            createPlaceholder(),
            createColspanSettings({ l: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C6' }),
          ],
          [
            createColspanSettings({ l: 'D1' }),
            createColspanSettings({ l: 'D2' }),
            createPlaceholder(),
            createColspanSettings({ l: 'D4' }),
            createColspanSettings({ l: 'D5' }),
            createColspanSettings({ l: 'D6' }),
            createColspanSettings({ l: 'D7' }),
            createColspanSettings({ l: 'D8' }),
            createColspanSettings({ l: 'D9' }),
            createColspanSettings({ l: '' }),
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
            createColspanSettings({ l: 'A1' }),
            createColspanSettings({ l: 'A2', colspan: 6, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'A3' }),
          ],
          [
            createColspanSettings({ l: 'B1' }),
            createColspanSettings({ l: 'B2', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B4' }),
          ],
          [
            createColspanSettings({ l: 'C1' }),
            createColspanSettings({ l: 'C2' }),
            createPlaceholder(),
            createColspanSettings({ l: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C6' }),
          ],
          [
            createColspanSettings({ l: 'D1' }),
            createColspanSettings({ l: 'D2' }),
            createPlaceholder(),
            createColspanSettings({ l: 'D4' }),
            createColspanSettings({ l: 'D5' }),
            createColspanSettings({ l: 'D6' }),
            createPlaceholder(),
            createColspanSettings({ l: 'D8' }),
            createColspanSettings({ l: 'D9' }),
            createColspanSettings({ l: '' }),
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
            createColspanSettings({ l: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'A2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'A3' }),
          ],
          [
            createColspanSettings({ l: 'B1' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B4' }),
          ],
          [
            createColspanSettings({ l: 'C1' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C6' }),
          ],
          [
            createColspanSettings({ l: 'D1' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4' }),
            createColspanSettings({ l: 'D5' }),
            createColspanSettings({ l: 'D6' }),
            createPlaceholder(),
            createColspanSettings({ l: 'D8' }),
            createColspanSettings({ l: 'D9' }),
            createColspanSettings({ l: '' }),
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
            createColspanSettings({ l: 'A2', colspan: 5, origColspan: 8 }),
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
            createColspanSettings({ l: 'B2', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 3, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4' }),
            createColspanSettings({ l: 'D5' }),
            createColspanSettings({ l: 'D6' }),
            createPlaceholder(),
            createColspanSettings({ l: 'D8' }),
            createColspanSettings({ l: 'D9' }),
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
            createColspanSettings({ l: 'A2', colspan: 3, origColspan: 8 }),
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
            createColspanSettings({ l: 'B2', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'C5', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D8' }),
            createColspanSettings({ l: 'D9' }),
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
            createColspanSettings({ l: 'A2', colspan: 1, origColspan: 8 }),
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
            createColspanSettings({ l: 'B3', colspan: 1, origColspan: 4 }),
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
            createColspanSettings({ l: 'C5', colspan: 1, origColspan: 2 }),
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
            createColspanSettings({ l: 'D8' }),
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
            createColspanSettings({ l: 'A1' }),
            createColspanSettings({ l: 'B1', colspan: 8, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
            createColspanSettings({ l: 'K1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A2' }),
            createColspanSettings({ l: 'B2', colspan: 8, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
            createColspanSettings({ l: 'K2', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A3' }),
            createColspanSettings({ l: 'B3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'F3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
            createColspanSettings({ l: 'K3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A4' }),
            createColspanSettings({ l: 'B4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'D4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
            createColspanSettings({ l: 'K4' }),
            createPlaceholder(),
            createColspanSettings({ l: 'L4', colspan: 1, origColspan: 2 }),
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
            createColspanSettings({ l: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B1', colspan: 6, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
            createColspanSettings({ l: 'K1', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A2' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2', colspan: 6, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
            createColspanSettings({ l: 'K2', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A3' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
            createColspanSettings({ l: 'K3', colspan: 2, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A4' }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
            createColspanSettings({ l: 'K4' }),
            createPlaceholder(),
            createColspanSettings({ l: 'L4', colspan: 1, origColspan: 2 }),
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
            createColspanSettings({ l: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B1', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
            createColspanSettings({ l: 'K1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2', colspan: 5, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
            createColspanSettings({ l: 'K2', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 1, origColspan: 4 }),
            createColspanSettings({ l: 'F3', colspan: 4, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
            createColspanSettings({ l: 'K3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4', colspan: 1, origColspan: 2 }),
            createColspanSettings({ l: 'F4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'H4', colspan: 2, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
            createColspanSettings({ l: 'K4' }),
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
            createColspanSettings({ l: 'A1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B1', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
            createColspanSettings({ l: 'K1', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
            createColspanSettings({ l: 'K2', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
            createColspanSettings({ l: 'K3', colspan: 1, origColspan: 3 }),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createColspanSettings({ l: 'A4' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F4', colspan: 1, origColspan: 2 }),
            createColspanSettings({ l: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
            createColspanSettings({ l: 'K4' }),
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
            createColspanSettings({ l: 'B1', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B2', colspan: 3, origColspan: 8 }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'B3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F3', colspan: 2, origColspan: 4 }),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
          ],
          [
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createPlaceholder(),
            createColspanSettings({ l: 'D4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'F4', colspan: 1, origColspan: 2 }),
            createColspanSettings({ l: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
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
            createColspanSettings({ l: 'B1', colspan: 1, origColspan: 8 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J1' }),
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
            createColspanSettings({ l: 'B2', colspan: 1, origColspan: 8 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J2' }),
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
            createColspanSettings({ l: 'F3', colspan: 1, origColspan: 4 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J3' }),
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
            createColspanSettings({ l: 'H4', colspan: 1, origColspan: 2 }),
            createPlaceholder(),
            createColspanSettings({ l: 'J4' }),
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
            createColspanSettings({ l: 'J1' }),
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
            createColspanSettings({ l: 'J2' }),
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
            createColspanSettings({ l: 'J3' }),
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
            createColspanSettings({ l: 'J4' }),
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
