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

function createRowspanPlaceholder() {
  return {
    label: '',
    isPlaceholder: true,
    isRowspanPlaceholder: true,
  };
}

describe('generateMatrix (rowspan)', () => {
  describe('should build headers settings array matrix with rowspan', () => {
    it('single header with rowspan spanning 2 rows', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1      | B1 |
       *   |         +----+
       *   |         | C1 |
       *   +----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', colspan: 2, rowspan: 2 }, 'B1'],
        ['', '', 'C1'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', colspan: 2, origColspan: 2, rowspan: 2, origRowspan: 2 }),
          createPlaceholder(),
          createColspanSettings({ l: 'B1' }),
        ],
        [
          createRowspanPlaceholder(),
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'C1' }),
        ],
      ]);
    });

    it('single column header with rowspan spanning all rows', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1 | B1      |
       *   +    +----+----+
       *   |    | C1 | D1 |
       *   +    +----+----+
       *   |    | E1 | F1 |
       *   +----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', rowspan: 3 }, { label: 'B1', colspan: 2 }],
        ['', 'C1', 'D1'],
        ['', 'E1', 'F1'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', rowspan: 3, origRowspan: 3 }),
          createColspanSettings({ l: 'B1', colspan: 2, origColspan: 2 }),
          createPlaceholder(),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'C1' }),
          createColspanSettings({ l: 'D1' }),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'E1' }),
          createColspanSettings({ l: 'F1' }),
        ],
      ]);
    });

    it('should place lower headers under correct columns when rowspan placeholders are omitted', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +    +----+----+
       *   |    | B2 | C2 |
       *   +----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', rowspan: 2 }, 'B1', 'C1'],
        ['B2', 'C2'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', rowspan: 2, origRowspan: 2 }),
          createColspanSettings({ l: 'B1' }),
          createColspanSettings({ l: 'C1' }),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'B2' }),
          createColspanSettings({ l: 'C2' }),
        ],
      ]);
    });

    it('multiple headers with rowspan in different positions', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+
       *   | A1 | B1      | C1 |
       *   +    +----+----+    +
       *   |    | D1 | E1 |    |
       *   +----+----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 2 }, { label: 'C1', rowspan: 2 }],
        ['', 'D1', 'E1', ''],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', rowspan: 2, origRowspan: 2 }),
          createColspanSettings({ l: 'B1', colspan: 2, origColspan: 2 }),
          createPlaceholder(),
          createColspanSettings({ l: 'C1', rowspan: 2, origRowspan: 2 }),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'D1' }),
          createColspanSettings({ l: 'E1' }),
          createRowspanPlaceholder(),
        ],
      ]);
    });

    it('header with both colspan and rowspan', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+
       *   | A1           | B1 |
       *   |              +----+
       *   |              | C1 |
       *   +----+----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', colspan: 3, rowspan: 2 }, 'B1'],
        ['', '', '', 'C1'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', colspan: 3, origColspan: 3, rowspan: 2, origRowspan: 2 }),
          createPlaceholder(),
          createPlaceholder(),
          createColspanSettings({ l: 'B1' }),
        ],
        [
          createRowspanPlaceholder(),
          createRowspanPlaceholder(),
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'C1' }),
        ],
      ]);
    });

    it('rowspan should be clamped to the number of remaining header levels', () => {
      /**
       * rowspan: 5 at level 0 with only 2 levels => effective rowspan = 2
       */
      const tree = createTree([
        [{ label: 'A1', rowspan: 5 }, 'B1'],
        ['', 'C1'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', rowspan: 5, origRowspan: 5 }),
          createColspanSettings({ l: 'B1' }),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'C1' }),
        ],
      ]);
    });

    it('no rowspan defined (rowspan defaults to 1)', () => {
      const tree = createTree([
        ['A1', 'B1'],
        ['A2', 'B2'],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1' }),
          createColspanSettings({ l: 'B1' }),
        ],
        [
          createColspanSettings({ l: 'A2' }),
          createColspanSettings({ l: 'B2' }),
        ],
      ]);
    });

    it('complex setup with multiple rowspans and colspans', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+
       *   | A1 | B1                     |
       *   +    +----+----+----+----+----+
       *   |    | C1      | D1      | E1 |
       *   +----+----+----+----+----+    +
       *   | F1 | G1 | H1 | I1 | J1 |    |
       *   +----+----+----+----+----+----+
       */
      const tree = createTree([
        [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 5 }],
        ['', { label: 'C1', colspan: 2 }, { label: 'D1', colspan: 2 }, { label: 'E1', rowspan: 2 }],
        ['F1', 'G1', 'H1', 'I1', 'J1', ''],
      ]);

      tree.buildTree();

      const matrix = generateMatrixFromTree(tree);

      expect(matrix).toEqual([
        [
          createColspanSettings({ l: 'A1', rowspan: 2, origRowspan: 2 }),
          createColspanSettings({ l: 'B1', colspan: 5, origColspan: 5 }),
          createPlaceholder(),
          createPlaceholder(),
          createPlaceholder(),
          createPlaceholder(),
        ],
        [
          createRowspanPlaceholder(),
          createColspanSettings({ l: 'C1', colspan: 2, origColspan: 2 }),
          createPlaceholder(),
          createColspanSettings({ l: 'D1', colspan: 2, origColspan: 2 }),
          createPlaceholder(),
          createColspanSettings({ l: 'E1', rowspan: 2, origRowspan: 2 }),
        ],
        [
          createColspanSettings({ l: 'F1' }),
          createColspanSettings({ l: 'G1' }),
          createColspanSettings({ l: 'H1' }),
          createColspanSettings({ l: 'I1' }),
          createColspanSettings({ l: 'J1' }),
          createRowspanPlaceholder(),
        ],
      ]);
    });
  });
});
