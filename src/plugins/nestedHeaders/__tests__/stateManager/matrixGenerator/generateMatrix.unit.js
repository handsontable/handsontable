/* eslint max-len: ["error", { "code": 140 }] */
import {
  createColspanSettings,
  createPlaceholder,
} from 'handsontable/plugins/nestedHeaders/__tests__/helpers';
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { generateMatrix } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';

function createTree(nestedHeadersSettings) {
  const source = new SourceSettings();

  source.setData(nestedHeadersSettings);

  return new HeadersTree(source);
}

function generateMatrixFromTree(tree) {
  return generateMatrix(tree.getRoots());
}

describe('generateMatrix', () => {
  describe('should build headers settings array matrix', () => {
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

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1' }),
          createColspanSettings({ l: 'B1' }),
          createColspanSettings({ l: 'C1' }),
        ],
        [
          createColspanSettings({ l: 'A2' }),
          createColspanSettings({ l: 'B2' }),
          createColspanSettings({ l: 'C2' }),
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

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', colspan: 4, origColspan: 4 }),
          createPlaceholder(),
          createPlaceholder(),
          createPlaceholder(),
        ],
        [
          createColspanSettings({ l: 'B1', colspan: 3, origColspan: 3 }),
          createPlaceholder(),
          createPlaceholder(),
          createColspanSettings({ l: 'B2' }),
        ],
        [
          createColspanSettings({ l: 'C1', colspan: 2, origColspan: 2 }),
          createPlaceholder(),
          createColspanSettings({ l: 'C2' }),
          createColspanSettings({ l: 'C3' }),
        ]
      ]);
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

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1' }),
          createColspanSettings({ l: 'A2', colspan: 8, origColspan: 8 }),
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
          createColspanSettings({ l: 'B2', colspan: 4, origColspan: 4 }),
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
          createColspanSettings({ l: 'C3', colspan: 3, origColspan: 3 }),
          createPlaceholder(),
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
          createColspanSettings({ l: 'D3' }),
          createColspanSettings({ l: 'D4' }),
          createColspanSettings({ l: 'D5' }),
          createColspanSettings({ l: 'D6' }),
          createColspanSettings({ l: 'D7' }),
          createColspanSettings({ l: 'D8' }),
          createColspanSettings({ l: 'D9' }),
          createColspanSettings({ l: '' }),
        ]
      ]);
    });
  });
});
