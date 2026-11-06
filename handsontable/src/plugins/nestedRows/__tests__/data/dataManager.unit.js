import DataManager from '../../data/dataManager';

/**
 * Builds a DataManager over the given tree.
 *
 * The tree path helpers read the structure cache only, so the plugin and the Handsontable
 * instance are never touched and can stay out of the way.
 *
 * @param {object[]} data The nested data.
 * @param {number[]} [trimmedRows] Physical rows the stubbed row index mapper reports as trimmed.
 * @returns {DataManager}
 */
function dataManagerWith(data, trimmedRows = []) {
  const trimmed = new Set(trimmedRows);
  const hot = {
    rowIndexMapper: {
      getNumberOfIndexes: () => 100,
      getNotTrimmedIndexesLength: () => 100 - trimmed.size,
      isTrimmed: row => trimmed.has(row),
    },
  };
  const dataManager = new DataManager(null, hot);

  dataManager.trimmedRows = trimmed;

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

describe('DataManager#getRowSetPosition', () => {
  it('should report each row\'s 1-based position among its siblings and the number of siblings', () => {
    const dataManager = dataManagerWith(sampleTree());
    const positions = [0, 1, 2, 3, 4, 5, 6].map(row => dataManager.getRowSetPosition(row));

    expect(positions).toEqual([
      { position: 1, setSize: 2 },
      { position: 1, setSize: 2 },
      { position: 2, setSize: 2 },
      { position: 1, setSize: 2 },
      { position: 2, setSize: 2 },
      { position: 2, setSize: 2 },
      { position: 1, setSize: 1 },
    ]);
  });

  it('should follow the tree after the cache is rebuilt', () => {
    const data = sampleTree();
    const dataManager = dataManagerWith(data);

    data[1].__children.push({ id: 'B-2' });
    dataManager.rewriteCache();

    expect(dataManager.getRowSetPosition(6)).toEqual({ position: 1, setSize: 2 });
    expect(dataManager.getRowSetPosition(7)).toEqual({ position: 2, setSize: 2 });
  });

  it('should count only the object entries among the siblings', () => {
    const dataManager = dataManagerWith([
      { id: 'A', __children: [{ id: 'A-1' }, null, { id: 'A-2' }] },
      { id: 'B' },
    ]);

    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 1, setSize: 2 });
    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 2, setSize: 2 });
    expect(dataManager.getRowSetPosition(3)).toEqual({ position: 2, setSize: 2 });
  });

  it('should keep loading a row whose `__children` is not an array', () => {
    const dataManager = dataManagerWith([
      { id: 'A', __children: 'abc' },
      { id: 'B' },
    ]);

    expect(dataManager.getRowSetPosition(0)).toEqual({ position: 1, setSize: 2 });
    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 2, setSize: 2 });
  });

  it('should count only the siblings that are not trimmed', () => {
    // A-1 (1) and A-2-b (4) trimmed.
    const dataManager = dataManagerWith(sampleTree(), [1, 4]);

    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 1, setSize: 1 });
    expect(dataManager.getRowSetPosition(3)).toEqual({ position: 1, setSize: 1 });
    expect(dataManager.getRowSetPosition(5)).toEqual({ position: 2, setSize: 2 });
    expect(dataManager.getRowSetPosition(6)).toEqual({ position: 1, setSize: 1 });
  });

  it('should count only the top-level rows that are not trimmed', () => {
    // A (0) and its subtree trimmed: only B is left at the top level.
    const dataManager = dataManagerWith(sampleTree(), [0, 1, 2, 3, 4]);

    expect(dataManager.getRowSetPosition(5)).toEqual({ position: 1, setSize: 1 });
    expect(dataManager.getRowSetPosition(6)).toEqual({ position: 1, setSize: 1 });
  });

  it('should keep the structural answer for a row that is trimmed itself', () => {
    const dataManager = dataManagerWith(sampleTree(), [1]);

    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 1, setSize: 2 });
  });

  it('should answer a changed trimming once the set positions are invalidated, and not before', () => {
    const dataManager = dataManagerWith(sampleTree(), [1, 5]);

    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 1, setSize: 1 });

    dataManager.trimmedRows.delete(1);
    // Cached until the index mapper reports a change.
    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 1, setSize: 1 });

    dataManager.invalidateSetPositions();
    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 2, setSize: 2 });

    dataManager.trimmedRows.add(2);
    dataManager.invalidateSetPositions();
    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 1, setSize: 1 });
  });

  it('should answer from the new tree after the cache is rebuilt while rows are trimmed', () => {
    const data = sampleTree();
    const dataManager = dataManagerWith(data, [2]);

    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 1, setSize: 1 });

    data[0].__children.push({ id: 'A-3' });
    dataManager.rewriteCache();

    expect(dataManager.getRowSetPosition(1)).toEqual({ position: 1, setSize: 2 });
  });

  it('should read a rendered header in O(1) after one pass over a parent with many children', () => {
    const children = Array.from({ length: 10000 }, (_, i) => ({ id: `c${i}` }));
    const dataManager = dataManagerWith([
      { id: 'P', __children: children },
      { id: 'Q', __children: [{ id: 'q' }] },
    ], [10002]);
    const isTrimmed = jest.spyOn(dataManager.hot.rowIndexMapper, 'isTrimmed');

    for (let row = 1; row <= 200; row++) {
      dataManager.getRowSetPosition(row);
    }

    expect(isTrimmed.mock.calls.length).toBeLessThanOrEqual(10000);
  });

  it('should return `null` for a row the cache does not know', () => {
    const dataManager = dataManagerWith(sampleTree());

    expect(dataManager.getRowSetPosition(99)).toBeNull();
  });

  describe('getRowsToKeepForMatches', () => {
    it('should keep a matched row whose level the cache does not know', () => {
      const dataManager = dataManagerWith(sampleTree());

      // The cache lists the rows, but has lost what it knows about them.
      dataManager.cache.nodeInfo = new WeakMap();

      expect(dataManager.getRowsToKeepForMatches([1, 5])).toEqual([1, 5]);
    });

    it('should still keep the subtree and the ancestors of a matched row the cache knows', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowsToKeepForMatches([2])).toEqual([0, 2, 3, 4]);
    });

    it('should keep a matched row past the cache and ignore a negative one', () => {
      const dataManager = dataManagerWith(sampleTree());

      expect(dataManager.getRowsToKeepForMatches([99, -1])).toEqual([99]);
    });

    describe('on a parent with 10k children', () => {
      const CHILD_COUNT = 10000;
      // Physical rows: 0 the parent, 1..10000 its children; child 5000 (row 5000) has one child of
      // its own at row 5001, which shifts the later children down by one.
      const DEEP_CHILD_INDEX = 4999;

      /**
       * @returns {object[]}
       */
      function wideTree() {
        const children = Array.from({ length: CHILD_COUNT }, (_, index) => ({ id: `C${index}` }));

        children[DEEP_CHILD_INDEX].__children = [{ id: 'deep' }];

        return [{ id: 'P', __children: children }];
      }

      it('should keep every row once every child matches', () => {
        const dataManager = dataManagerWith(wideTree());
        const childRows = [];

        for (let row = 1; row <= CHILD_COUNT + 1; row++) {
          if (row !== DEEP_CHILD_INDEX + 2) {
            childRows.push(row);
          }
        }

        // Every child matches; the deep row is kept as the subtree of its matching parent.
        const kept = dataManager.getRowsToKeepForMatches(childRows);

        expect(kept.length).toBe(CHILD_COUNT + 2);
        expect(kept[0]).toBe(0);
        expect(kept[kept.length - 1]).toBe(CHILD_COUNT + 1);
      });

      it('should keep only the ancestor chain of a single deep match', () => {
        const dataManager = dataManagerWith(wideTree());
        const deepRow = DEEP_CHILD_INDEX + 2;

        expect(dataManager.getRowsToKeepForMatches([deepRow])).toEqual([0, deepRow - 1, deepRow]);
      });
    });

    it('should keep a blank match with its ancestors but not its subtree', () => {
      const dataManager = dataManagerWith(sampleTree());

      // A-2 (row 2) matches only through a blank cell: it keeps A, but not A-2-a or A-2-b. B (row 5)
      // matches a value, so it keeps B-1.
      expect(dataManager.getRowsToKeepForMatches([2, 5], [2])).toEqual([0, 2, 5, 6]);
      // A blank match inside the subtree of a value match is kept with that subtree.
      expect(dataManager.getRowsToKeepForMatches([0, 2], [2])).toEqual([0, 1, 2, 3, 4]);
      // A blank-only parent still keeps a child that matches on its own.
      expect(dataManager.getRowsToKeepForMatches([2, 4], [2])).toEqual([0, 2, 4]);
    });

    it('should keep every match while the cache is empty', () => {
      const dataManager = dataManagerWith(sampleTree());

      // The flatten cache is empty before the first load of a tree, for example during a sheet switch.
      dataManager.cache.rows = [];

      expect(dataManager.getRowsToKeepForMatches([0, 3])).toEqual([0, 3]);
    });
  });
});
