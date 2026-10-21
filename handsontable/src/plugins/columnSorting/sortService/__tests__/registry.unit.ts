// Imported first, and for the side effect: both plugin modules mark their built-in root comparator at
// load time. `sortService/registry` sits in an import cycle with `sortFunction/*`, so a test that
// reaches it before any plugin module would resolve the barrel's re-exports against a half-built
// module.
import 'handsontable/plugins/columnSorting/columnSorting';
import 'handsontable/plugins/multiColumnSorting/multiColumnSorting';
import {
  getBuiltInPositionComparator,
  getRootComparator,
  markBuiltInRootComparator,
  registerRootComparator,
} from 'handsontable/plugins/columnSorting/sortService/registry';
import { positionComparator, rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';

describe('sortService registry: the built-in root comparator guard', () => {
  afterEach(() => {
    // The registry is module-global, so a test that replaces a comparator has to put the built-in
    // one back or every later sort in the process takes the fallback path.
    registerRootComparator('columnSorting', rootComparator);
  });

  it('should pair each built-in root comparator with its parallel-value-arrays equivalent', () => {
    expect(getBuiltInPositionComparator('columnSorting')).toBe(positionComparator);
    expect(getBuiltInPositionComparator('multiColumnSorting')).not.toBe(undefined);
    expect(getBuiltInPositionComparator('multiColumnSorting')).not.toBe(positionComparator);
  });

  it('should not report a built-in comparator for an unregistered id', () => {
    expect(getBuiltInPositionComparator('noSuchSortingPlugin')).toBe(undefined);
  });

  it('should stop reporting a built-in comparator once a custom one takes over the same key', () => {
    const customRootComparator = () => () => 0;

    registerRootComparator('columnSorting', customRootComparator);

    // `staticRegister.register()` replaces silently, so the key alone proves nothing - only the
    // identity of the function registered right now does.
    expect(getRootComparator('columnSorting')).toBe(customRootComparator);
    expect(getBuiltInPositionComparator('columnSorting')).toBe(undefined);

    registerRootComparator('columnSorting', rootComparator);

    expect(getBuiltInPositionComparator('columnSorting')).toBe(positionComparator);
  });

  it('should keep reporting the built-in comparator when it is re-registered under another key', () => {
    markBuiltInRootComparator(rootComparator, positionComparator);
    registerRootComparator('customColumnSortingKey', rootComparator);

    expect(getBuiltInPositionComparator('customColumnSortingKey')).toBe(positionComparator);
  });
});
