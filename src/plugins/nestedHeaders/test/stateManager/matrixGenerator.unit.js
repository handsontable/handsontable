import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { matrixGenerator } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';

function generateMatrix(nestedHeadersSettings) {
  const tree = new HeadersTree(new SourceSettings(nestedHeadersSettings));

  tree.buildTree();

  return matrixGenerator(tree.getRoots());
}

describe('matrixGenerator', () => {
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
      const colspans = generateMatrix([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'B1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'C1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
        ],
        [
          { label: 'A2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'B2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'C2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
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
      const colspans = generateMatrix([
        [{ label: 'A1', colspan: 4 }],
        [{ label: 'B1', colspan: 3 }, 'B2'],
        [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false }
        ],
        [
          { label: 'B1', colspan: 3, origColspan: 3, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'B2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
        ],
        [
          { label: 'C1', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'C2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'C3', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
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
      const colspans = generateMatrix([
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ]);

      expect(colspans).toEqual([
        [
          { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'A2', colspan: 8, origColspan: 8, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'A3', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
        ],
        [
          { label: 'B1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'B2', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'B3', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'B4', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
        ],
        [
          { label: 'C1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'C2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'C3', colspan: 3, origColspan: 3, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'C4', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'C5', colspan: 2, origColspan: 2, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false },
          { label: 'C6', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
        ],
        [
          { label: 'D1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D3', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D4', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D5', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D6', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D7', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D8', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: 'D9', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false },
          { label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false }
        ]
      ]);
    });
  });
});
