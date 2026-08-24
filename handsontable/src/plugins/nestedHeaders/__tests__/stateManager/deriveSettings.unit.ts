import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { generateMatrix } from 'handsontable/plugins/nestedHeaders/stateManager/matrixGenerator';
import { deriveVisualSettings } from 'handsontable/plugins/nestedHeaders/stateManager/deriveSettings';
import {
  createColumnArrangementAdapter,
  createIdentityColumnArrangement,
} from 'handsontable/plugins/nestedHeaders/stateManager/columnArrangement';

/**
 * Builds the legacy header matrix straight from user settings (authored order).
 *
 * @param {Array[]} userSettings The user-defined nested headers settings.
 * @returns {Array[]} The generated matrix.
 */
function legacyMatrix(userSettings) {
  const source = new SourceSettings();

  source.setData(userSettings);

  const tree = new HeadersTree(source);

  tree.buildTree();

  return generateMatrix(tree.getRoots());
}

/**
 * Builds the header matrix from an already-normalized (e.g. derived) settings matrix.
 *
 * @param {Array[]} normalizedSettings The normalized header settings.
 * @returns {Array[]} The generated matrix.
 */
function matrixFromNormalized(normalizedSettings) {
  const source = new SourceSettings();

  source.setNormalizedData(normalizedSettings);

  const tree = new HeadersTree(source);

  tree.buildTree();

  return generateMatrix(tree.getRoots());
}

/**
 * Returns the authored (normalized) settings for the given user settings.
 *
 * @param {Array[]} userSettings The user-defined nested headers settings.
 * @returns {Array[]} The normalized authored settings.
 */
function authoredFrom(userSettings) {
  const source = new SourceSettings();

  source.setData(userSettings);

  return source.getData();
}

/**
 * Creates an arrangement from an explicit visual-to-physical order array.
 *
 * @param {number[]} order The physical column index at each visual position.
 * @returns {object} A ColumnArrangement.
 */
function arrangementFromOrder(order) {
  return createColumnArrangementAdapter({
    columnIndexMapper: {
      getPhysicalFromVisualIndex: visualIndex => order[visualIndex] ?? null,
    },
  } as never);
}

describe('nestedHeaders deriveVisualSettings', () => {
  describe('identity arrangement reproduces the legacy structure (regression gate)', () => {
    const fixtures = [
      {
        name: 'flat headers',
        settings: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
      },
      {
        name: 'two groups over leaves',
        settings: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
      },
      {
        name: 'nested without overlap',
        settings: [
          [{ label: 'A1', colspan: 4 }],
          [{ label: 'B1', colspan: 3 }, 'B2'],
          [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
        ],
      },
      {
        name: 'mixed group and standalone',
        settings: [
          [{ label: 'Group A', colspan: 2 }, { label: 'Group B', colspan: 2 }, 'C'],
          ['A1', 'A2', 'B1', 'B2', 'C'],
        ],
      },
    ];

    fixtures.forEach(({ name, settings }) => {
      it(`should match the legacy matrix at identity order - ${name}`, () => {
        const authored = authoredFrom(settings);
        const derived = deriveVisualSettings(authored, createIdentityColumnArrangement());

        expect(matrixFromNormalized(derived)).toEqual(legacyMatrix(settings));
      });
    });
  });

  describe('moved arrangement makes the headers follow the data', () => {
    it('should move a leaf out of its group and split the group into two same-label banners', () => {
      const authored = authoredFrom([
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ]);
      // Move physical column 0 (Street) to the visual end: visual order = [1, 2, 3, 0].
      const matrix = matrixFromNormalized(deriveVisualSettings(authored, arrangementFromOrder([1, 2, 3, 0])));

      // Top level: Address(1) | Finance(2) | placeholder | Address(1) - the group is split.
      expect(matrix[0].map(cell => cell.label)).toEqual(['Address', 'Finance', '', 'Address']);
      expect(matrix[0][1].colspan).toBe(2);
      // Leaf level follows the data.
      expect(matrix[1].map(cell => cell.label)).toEqual(['City', 'Revenue', 'Profit', 'Street']);
    });

    it('should keep a whole group intact when its columns stay adjacent after a move', () => {
      const authored = authoredFrom([
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ]);
      // Move the whole Address group to the end: visual order = [2, 3, 0, 1].
      const matrix = matrixFromNormalized(deriveVisualSettings(authored, arrangementFromOrder([2, 3, 0, 1])));

      expect(matrix[0].map(cell => cell.label)).toEqual(['Finance', '', 'Address', '']);
      expect(matrix[0][0].colspan).toBe(2);
      expect(matrix[0][2].colspan).toBe(2);
      expect(matrix[1].map(cell => cell.label)).toEqual(['Revenue', 'Profit', 'Street', 'City']);
    });

    it('should render a standalone header for a column moved in from outside the authored width', () => {
      const authored = authoredFrom([
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ]);
      // Grid wider than the 4-column definition: physical 5 (no authored header) is moved into visual
      // 0, displacing authored physical 0. The structure stays 4 wide (the authored width); visual 0
      // renders as a standalone header because physical 5 has no authored owner.
      const matrix = matrixFromNormalized(deriveVisualSettings(authored, arrangementFromOrder([5, 1, 2, 3])));

      expect(matrix[0].map(cell => cell.label)).toEqual(['', 'Address', 'Finance', '']);
      expect(matrix[0][1].colspan).toBe(1); // Address split to a single column (lost physical 0).
      expect(matrix[0][2].colspan).toBe(2); // Finance still spans its two columns.
      expect(matrix[1].map(cell => cell.label)).toEqual(['', 'City', 'Revenue', 'Profit']);
    });

    it('should preserve the multi-level nesting invariant when an inner group splits', () => {
      const authored = authoredFrom([
        [{ label: 'Top', colspan: 4 }],
        [{ label: 'L', colspan: 2 }, { label: 'R', colspan: 2 }],
        ['a', 'b', 'c', 'd'],
      ]);
      // Swap physical columns 1 and 2: visual order = [0, 2, 1, 3]. Inner L/R split, Top stays whole.
      const matrix = matrixFromNormalized(deriveVisualSettings(authored, arrangementFromOrder([0, 2, 1, 3])));

      expect(matrix[0][0].label).toBe('Top');
      expect(matrix[0][0].colspan).toBe(4);
      expect(matrix[1].map(cell => cell.label)).toEqual(['L', 'R', 'L', 'R']);
      expect(matrix[2].map(cell => cell.label)).toEqual(['a', 'c', 'b', 'd']);
    });
  });

  describe('membership overrides (column move re-parenting)', () => {
    it('should re-parent a column into a group when its override points to that group owner', () => {
      const authored = authoredFrom([
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ]);
      // Physical 2 (Revenue) adopted into Address (owner index 0) at the top level.
      const overrides = new Map([[2, new Map([[0, 0]])]]);
      const derived = deriveVisualSettings(authored, createIdentityColumnArrangement(), overrides);

      expect(derived[0][0].label).toBe('Address');
      expect(derived[0][0].origColspan).toBe(3); // Address absorbed Revenue -> spans 3
      expect(derived[0][3].label).toBe('Finance');
      expect(derived[0][3].origColspan).toBe(1); // Finance lost Revenue -> spans 1
      // The leaf level is never overridden - each column keeps its own label.
      expect(derived[1].map(cell => cell.label)).toEqual(['Street', 'City', 'Revenue', 'Profit']);
    });

    it('should render a column standalone when its override is negative', () => {
      const authored = authoredFrom([
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ]);
      // Physical 0 (Street) released from Address to standalone at the top level.
      const overrides = new Map([[0, new Map([[0, -1]])]]);
      const derived = deriveVisualSettings(authored, createIdentityColumnArrangement(), overrides);

      expect(derived[0][0].label).toBe(''); // standalone -> blank group cell
      expect(derived[0][0].origColspan).toBe(1);
      expect(derived[0][1].label).toBe('Address'); // Address now covers City only
      expect(derived[0][1].origColspan).toBe(1);
    });
  });
});
