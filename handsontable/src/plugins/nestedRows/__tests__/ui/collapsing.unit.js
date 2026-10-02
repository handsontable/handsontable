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

  // Whether the spread above overflows depends on the engine's stack size, so the width of the widest
  // `push()` call is measured too. A Jest spy cannot do it: it records each call with `push()` itself.
  it('should add the rows of a subtree one `push()` argument at a time', () => {
    const { collapsingUI } = collapsingUIWithChildren(2000);
    const originalPush = Array.prototype.push;
    let widestCall = 0;

    // eslint-disable-next-line no-extend-native
    Array.prototype.push = function(...items) {
      widestCall = Math.max(widestCall, items.length);

      return originalPush.apply(this, items);
    };

    try {
      collapsingUI.collapseMultipleChildren([0]);
      collapsingUI.expandMultipleChildren([0]);
    } finally {
      // eslint-disable-next-line no-extend-native
      Array.prototype.push = originalPush;
    }

    expect(widestCall).toBeLessThan(100);
  });
});
