import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';
import { rootComparator } from '../rootComparator';
import { rootComparator as multiRootComparator } from '../../multiColumnSorting/rootComparator';
import { markBuiltInRootComparator, registerRootComparator } from '../sortService';
import { compareFunctionFactory as defaultCompareFunctionFactory } from '../sortFunction/default';

// `sortByPresetSortStates()` sorts a plain positions array against parallel value arrays whenever the
// root comparator registered under the plugin's key is still the built-in one. A custom root
// comparator registered through `registerRootComparator()` must keep receiving `[rowIndex, ...values]`
// tuples, and must keep deciding the order.
//
// The guard is an identity check on the registered function, not a whitelist of plugin keys:
// `staticRegister.register()` replaces silently, so a custom comparator lands under the very key the
// plugin sorts with.
const DATA = [
  ['Header', 25],
  ['Banana', 20],
  ['Apple', 10],
  ['Date', 40],
  ['Cherry', 30],
  ['Total', 35],
];

describe.each([
  ['columnSorting', ColumnSorting, rootComparator],
  ['multiColumnSorting', MultiColumnSorting, multiRootComparator],
])('%s with a custom root comparator', (pluginKey, PluginClass, builtInRootComparator) => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(PluginClass);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    // The registry is module-global - put the built-in comparator back, or every later sort in this
    // process takes the fallback path.
    registerRootComparator(pluginKey, builtInRootComparator);
  });

  it('should keep receiving `[rowIndex, ...values]` tuples and keep deciding the order', () => {
    const seenArguments = [];

    registerRootComparator(pluginKey, () => (rowWithValues, nextRowWithValues) => {
      seenArguments.push(rowWithValues, nextRowWithValues);

      // Descending on the value, so the result cannot be mistaken for the built-in ascending sort.
      return nextRowWithValues[1] - rowWithValues[1];
    });

    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      [pluginKey]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(1)).toEqual([40, 35, 30, 25, 20, 10]);
    expect(seenArguments.length).toBeGreaterThan(0);
    seenArguments.forEach((rowWithValues) => {
      expect(Array.isArray(rowWithValues)).toBe(true);
      expect(rowWithValues.length).toBe(2);
      // The row index sits at index 0 and the sorted column's value right after it.
      expect(hot.getDataAtCell(hot.toVisualRow(rowWithValues[0]), 1)).toBe(rowWithValues[1]);
    });
  });

  it('should produce the same order as the built-in path when it reproduces the built-in verdicts', () => {
    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      [pluginKey]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });

    const builtInOrder = hot.getDataAtCol(1);

    registerRootComparator(pluginKey, (...args) => builtInRootComparator(...args));

    hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(1)).toEqual(builtInOrder);
  });
});

describe('sorting rows tied on every sorted column', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ColumnSorting);
    registerPlugin(MultiColumnSorting);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should keep tied rows in their source order (columnSorting)', () => {
    hot = new Handsontable(container, {
      data: [
        ['a', 2], ['b', 1], ['c', 2], ['d', 1], ['e', 2], ['f', 1],
      ],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    // Sorting positions instead of tuples keeps `Array.prototype.sort`'s stability, so `b`, `d`, `f`
    // and then `a`, `c`, `e` stay in the order the gather loop produced.
    expect(hot.getDataAtCol(0)).toEqual(['b', 'd', 'f', 'a', 'c', 'e']);
  });

  it('should break ties with the later sorted columns, in order (multiColumnSorting)', () => {
    hot = new Handsontable(container, {
      data: [
        ['a', 2, 5, 1], ['b', 1, 9, 1], ['c', 2, 5, 0], ['d', 2, 3, 7], ['e', 1, 9, 0],
      ],
      multiColumnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('multiColumnSorting').sort([
      { column: 1, sortOrder: 'asc' },
      { column: 2, sortOrder: 'desc' },
      { column: 3, sortOrder: 'asc' },
    ]);

    // Column 1 asc: b, e (1) before a, c, d (2).
    // Column 2 desc breaks the first group's tie at 9/9, so column 3 asc decides: e (0) before b (1).
    // In the second group column 2 desc gives a, c (5) before d (3), and column 3 asc orders c (0)
    // before a (1).
    expect(hot.getDataAtCol(0)).toEqual(['e', 'b', 'c', 'a', 'd']);
  });
});

describe('the parallel-value-arrays path', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ColumnSorting);
    registerPlugin(MultiColumnSorting);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    registerRootComparator('columnSorting', rootComparator);
    registerRootComparator('multiColumnSorting', multiRootComparator);
  });

  it('should be taken, and the tuple comparator skipped, whenever the root comparator is marked built-in', () => {
    const tupleComparator = jest.fn(() => 0);
    const markedRootComparator = () => tupleComparator;
    const seenColumnValues = [];

    // Marked as built-in, so `sortByPresetSortStates()` must use the position comparator and never
    // build a tuple. The two disagree on purpose: only the position comparator sorts ascending.
    markBuiltInRootComparator(markedRootComparator, (sortingOrders, columnMetas, columnValues) => {
      seenColumnValues.push(columnValues);

      return (position, nextPosition) => columnValues[0][position] - columnValues[0][nextPosition];
    });
    registerRootComparator('columnSorting', markedRootComparator);

    hot = new Handsontable(container, {
      data: [['a', 30], ['b', 10], ['c', 20]],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['b', 'c', 'a']);
    expect(tupleComparator).not.toHaveBeenCalled();
    // One array per sorted column, holding the band's values in gather order, not a tuple per row.
    expect(seenColumnValues).toEqual([[[30, 10, 20]]]);
  });

  it('should hand one value array per sorted column to a multi-column sort', () => {
    const seenColumnValues = [];
    const markedRootComparator = () => () => 0;

    markBuiltInRootComparator(markedRootComparator, (sortingOrders, columnMetas, columnValues) => {
      seenColumnValues.push(columnValues, sortingOrders);

      return (position, nextPosition) => columnValues[1][position] - columnValues[1][nextPosition];
    });
    registerRootComparator('multiColumnSorting', markedRootComparator);

    hot = new Handsontable(container, {
      data: [['a', 1, 30], ['b', 1, 10], ['c', 1, 20]],
      multiColumnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('multiColumnSorting').sort([
      { column: 1, sortOrder: 'asc' },
      { column: 2, sortOrder: 'desc' },
    ]);

    expect(hot.getDataAtCol(0)).toEqual(['b', 'c', 'a']);
    expect(seenColumnValues[0]).toEqual([[1, 1, 1], [30, 10, 20]]);
    expect(seenColumnValues[1]).toEqual(['asc', 'desc']);
  });

  it('should extract the keys through the compare function seam once per sorted column', () => {
    let prepareValuesSpy = null;

    // The built-in compare function, handed over through the documented per-column option so the
    // instance the sort run creates can be spied on. The factory is the built-in one, so the
    // compare function it returns carries the seam marker exactly as an untouched run would.
    const compareFunctionFactory = (...args) => {
      const compareFunction = defaultCompareFunctionFactory(...args);

      prepareValuesSpy = jest.spyOn(compareFunction, 'prepareValues');

      return compareFunction;
    };

    hot = new Handsontable(container, {
      data: [['a', 30], ['b', 10], ['c', 20]],
      columns: [{}, { columnSorting: { compareFunctionFactory } }],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['b', 'c', 'a']);
    // Drop `markPreparedCompareFn()` from the built-in factory and the compare function is no
    // longer recognized as carrying the seam: the sort still comes out ascending, but through the
    // pairwise fallback, which never asks for the keys. That is what this call count pins - on a
    // real grid, not on a comparator called in isolation.
    expect(prepareValuesSpy).toHaveBeenCalledTimes(1);
    expect(prepareValuesSpy).toHaveBeenCalledWith([30, 10, 20]);
  });
});
