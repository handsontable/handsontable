import DataManager from '../../data/dataManager';

/**
 * Builds a DataManager over the given tree.
 *
 * The tree path helpers read the structure cache only, so the plugin and the Handsontable
 * instance are never touched and can stay out of the way.
 *
 * @param {object[]} data The nested data.
 * @returns {DataManager}
 */
function dataManagerWith(data) {
  const dataManager = new DataManager(null, null);

  dataManager.updateWithData(data);

  return dataManager;
}

/**
 * Physical row indexes of this tree:
 *   0 A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 B / 6 B-1.
 *
 * @returns {object[]}
 */
function sampleTree() {
  return [
    {
      id: 'A',
      __children: [
        { id: 'A-1' },
        { id: 'A-2', __children: [{ id: 'A-2-a' }, { id: 'A-2-b' }] },
      ],
    },
    {
      id: 'B',
      __children: [{ id: 'B-1' }],
    },
  ];
}

describe('NestedRows DataManager', () => {
  describe('getRowTreePath', () => {
    it('should return a single-element path for a top-level row', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowTreePath(0)).toEqual([0]);
      expect(dataManager.getRowTreePath(5)).toEqual([1]);
    });

    it('should return the chain of child indexes for a nested row', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowTreePath(1)).toEqual([0, 0]);
      expect(dataManager.getRowTreePath(2)).toEqual([0, 1]);
      expect(dataManager.getRowTreePath(3)).toEqual([0, 1, 0]);
      expect(dataManager.getRowTreePath(4)).toEqual([0, 1, 1]);
      expect(dataManager.getRowTreePath(6)).toEqual([1, 0]);
    });

    it('should return `null` for a row that is not part of the structure', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowTreePath(7)).toBe(null);
      expect(dataManager.getRowTreePath(-1)).toBe(null);
    });
  });

  describe('getRowIndexByTreePath', () => {
    it('should find the physical row index the path points at', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowIndexByTreePath([0])).toBe(0);
      expect(dataManager.getRowIndexByTreePath([0, 1])).toBe(2);
      expect(dataManager.getRowIndexByTreePath([0, 1, 1])).toBe(4);
      expect(dataManager.getRowIndexByTreePath([1, 0])).toBe(6);
    });

    it('should return `null` for a path that leads outside the structure', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowIndexByTreePath([2])).toBe(null);
      expect(dataManager.getRowIndexByTreePath([0, 0, 0])).toBe(null);
      expect(dataManager.getRowIndexByTreePath([])).toBe(null);
      expect(dataManager.getRowIndexByTreePath(null)).toBe(null);
    });

    it('should round-trip every row of the tree', () => {
      const dataManager = dataManagerWith(sampleTree());

      for (let row = 0; row < 7; row++) {
        expect(dataManager.getRowIndexByTreePath(dataManager.getRowTreePath(row))).toBe(row);
      }
    });

    it('should point at the same node after the children counts change', () => {
      const dataManager = dataManagerWith(sampleTree());
      // `A-2` sits at physical row 2, `B` at physical row 5.
      const pathToA2 = dataManager.getRowTreePath(2);
      const pathToB = dataManager.getRowTreePath(5);
      const grownTree = sampleTree();

      grownTree[0].__children[1].__children.push({ id: 'A-2-c' });
      dataManager.updateWithData(grownTree);

      // The extra child pushed `B` down by one, but neither path had to change.
      expect(dataManager.getRowIndexByTreePath(pathToA2)).toBe(2);
      expect(dataManager.getRowIndexByTreePath(pathToB)).toBe(6);
      expect(dataManager.getDataObject(6).id).toBe('B');
    });
  });
});
