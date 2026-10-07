import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';

const DATA = [
  ['Banana', 3],
  ['Apple', 1],
  ['Cherry', 4],
  ['Date', 1],
  ['Elderberry', 5],
];

/**
 * Builds a `compareFunctionFactory` that counts every comparison it performs, so the two enable
 * paths below can be measured against each other instead of against a hardcoded call count -
 * pinning the exact number would rot with the sort algorithm (DEV-187 discussion).
 *
 * @returns {{counter: {calls: number}, compareFunctionFactory: Function}}
 */
function createCountingComparator() {
  const counter = { calls: 0 };
  const compareFunctionFactory = sortOrder => (a, b) => {
    counter.calls += 1;

    if (a === b) {
      return 0;
    }

    const ascending = a > b ? 1 : -1;

    return sortOrder === 'desc' ? -ascending : ascending;
  };

  return { counter, compareFunctionFactory };
}

// `MultiColumnSorting` overrides neither `onUpdateSettings` nor `sortBySettings`, so it inherits
// this bug (and this fix) unchanged from `ColumnSorting`.
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('%s - comparator call count when enabling via updateSettings (DEV-187)', (pluginKey, PluginClass) => {
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
  });

  it('should run the comparator the same number of times whether the sort was configured ' +
    'at construction or enabled later via updateSettings', async() => {
    // Baseline: the plugin enabled at construction time, sorting via `initialConfig`.
    const baseline = createCountingComparator();

    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      licenseKey: 'non-commercial-and-evaluation',
      [pluginKey]: {
        initialConfig: { column: 1, sortOrder: 'asc' },
        compareFunctionFactory: baseline.compareFunctionFactory,
      },
    });

    const baselineCalls = baseline.counter.calls;

    // A run that never sorts (e.g. a broken selector) would make the assertion below vacuous.
    expect(baselineCalls).toBeGreaterThan(0);

    hot.destroy();
    container.innerHTML = '';

    // Regression case: the plugin starts disabled and is switched on later, through
    // `updateSettings`, exactly as loading a sort config from a deferred source would.
    const enabledLater = createCountingComparator();

    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({
      [pluginKey]: {
        initialConfig: { column: 1, sortOrder: 'asc' },
        compareFunctionFactory: enabledLater.compareFunctionFactory,
      },
    });

    expect(enabledLater.counter.calls).toBe(baselineCalls);
  });

  it('should still re-sort when updateSettings changes the config of an already-enabled plugin', async() => {
    // Guards the other side of the fix: `wasEnabled && this.enabled` must stay true (not be
    // over-guarded to `false`) when the plugin was already enabled before the updateSettings call.
    const first = createCountingComparator();

    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      licenseKey: 'non-commercial-and-evaluation',
      [pluginKey]: {
        initialConfig: { column: 1, sortOrder: 'asc' },
        compareFunctionFactory: first.compareFunctionFactory,
      },
    });

    expect(first.counter.calls).toBeGreaterThan(0);

    const second = createCountingComparator();

    hot.updateSettings({
      [pluginKey]: {
        initialConfig: { column: 0, sortOrder: 'desc' },
        compareFunctionFactory: second.compareFunctionFactory,
      },
    });

    expect(second.counter.calls).toBeGreaterThan(0);
    expect(hot.getDataAtCol(0)).toEqual(['Elderberry', 'Date', 'Cherry', 'Banana', 'Apple']);
  });
});
