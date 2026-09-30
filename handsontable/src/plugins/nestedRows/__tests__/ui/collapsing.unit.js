import DataManager from '../../data/dataManager';
import CollapsingUI from '../../ui/collapsing';

/**
 * Builds the collapsing UI over one parent row with the given number of children. A real grid of
 * that size takes minutes to build in jsdom, so the grid and the plugin are small stand-ins and the
 * data manager is the real one.
 *
 * @param {number} childCount The number of children.
 * @returns {{ collapsingUI: CollapsingUI, trimmedRows: Map }} The UI and the rows it trimmed.
 */
function collapsingUIWithChildren(childCount) {
  const children = new Array(childCount);

  for (let index = 0; index < childCount; index++) {
    children[index] = { a: `child ${index}` };
  }

  const dataManager = new DataManager(null, null);
  const trimmedRows = new Map();

  dataManager.updateWithData([{ a: 'parent', __children: children }]);

  const plugin = {
    dataManager,
    collapsedRowsMap: {
      setValueAtIndex: (physicalRow, value) => trimmedRows.set(physicalRow, value),
    },
    runOperation: (name, callback) => callback(),
  };
  const hot = {
    batchExecution: callback => callback(),
    render: () => {},
  };

  return { collapsingUI: new CollapsingUI(plugin, hot), trimmedRows };
}

describe('NestedRows collapsing UI', () => {
  // Spreading a list that long into `push()` passes each item as an argument, which overflows the
  // call stack with a `RangeError`.
  it('should collapse and expand a parent with more children than a function call takes arguments', () => {
    const { collapsingUI, trimmedRows } = collapsingUIWithChildren(150000);

    expect(() => collapsingUI.collapseMultipleChildren([0])).not.toThrow();
    expect(collapsingUI.collapsedRows).toEqual([0]);
    expect(trimmedRows.size).toBe(150000);
    expect(trimmedRows.get(1)).toBe(true);
    expect(trimmedRows.get(150000)).toBe(true);

    expect(() => collapsingUI.expandMultipleChildren([0])).not.toThrow();
    expect(collapsingUI.collapsedRows).toEqual([]);
    expect(trimmedRows.get(1)).toBe(false);
    expect(trimmedRows.get(150000)).toBe(false);
  });
});
