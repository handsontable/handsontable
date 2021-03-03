/* eslint max-len: ["error", { "code": 140 }] */
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { generateMatrix } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';

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

      const matrix = generateMatrixFromTree(tree);

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
    });
  });
});
