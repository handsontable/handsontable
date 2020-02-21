import HeadersTree from 'handsontable/plugins/nestedHeaders/columnStatesManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/columnStatesManager/sourceSettings';
import { colspanGenerator } from 'handsontable/plugins/nestedHeaders/columnStatesManager/colspanGenerator';

function generateColspanMatrix(nestedHeadersSettings) {
  const tree = new HeadersTree(new SourceSettings(nestedHeadersSettings));

  tree.buildTree();

  return colspanGenerator(tree.getRoots());
}

describe('colspanGenerator', () => {
  describe('should build a colspan array matrix', () => {
    it('no nested headers defined', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +----+----+----+
       *   | A1 | B1 | C1 |
       *   +----+----+----+
       */
      const colspans = generateColspanMatrix([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 1, hidden: false },
          { label: 'B1', colspan: 1, hidden: false },
          { label: 'C1', colspan: 1, hidden: false },
        ],
        [
          { label: 'A2', colspan: 1, hidden: false },
          { label: 'B2', colspan: 1, hidden: false },
          { label: 'C2', colspan: 1, hidden: false },
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
      const colspans = generateColspanMatrix([
        [{ label: 'A1', colspan: 4 }],
        [{ label: 'B1', colspan: 3 }, 'B2'],
        [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 4, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true }
        ],
        [
          { label: 'B1', colspan: 3, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: 'B2', colspan: 1, hidden: false }
        ],
        [
          { label: 'C1', colspan: 2, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: 'C2', colspan: 1, hidden: false },
          { label: 'C3', colspan: 1, hidden: false }
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
      const colspans = generateColspanMatrix([
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 1, hidden: false },
          { label: 'A2', colspan: 8, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: 'A3', colspan: 1, hidden: false }
        ],
        [
          { label: 'B1', colspan: 1, hidden: false },
          { label: 'B2', colspan: 4, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: 'B3', colspan: 4, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: 'B4', colspan: 1, hidden: false }
        ],
        [
          { label: 'C1', colspan: 1, hidden: false },
          { label: 'C2', colspan: 1, hidden: false },
          { label: 'C3', colspan: 3, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: '', colspan: 1, hidden: true },
          { label: 'C4', colspan: 2, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: 'C5', colspan: 2, hidden: false },
          { label: '', colspan: 1, hidden: true },
          { label: 'C6', colspan: 1, hidden: false }
        ],
        [
          { label: 'D1', colspan: 1, hidden: false },
          { label: 'D2', colspan: 1, hidden: false },
          { label: 'D3', colspan: 1, hidden: false },
          { label: 'D4', colspan: 1, hidden: false },
          { label: 'D5', colspan: 1, hidden: false },
          { label: 'D6', colspan: 1, hidden: false },
          { label: 'D7', colspan: 1, hidden: false },
          { label: 'D8', colspan: 1, hidden: false },
          { label: 'D9', colspan: 1, hidden: false },
          { label: '', colspan: 1, hidden: false }
        ]
      ]);
    });
  });
});
