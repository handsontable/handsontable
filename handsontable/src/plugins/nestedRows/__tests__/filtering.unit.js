import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { NestedRows } from 'handsontable/plugins/nestedRows';
import { UndoRedo } from 'handsontable/plugins/undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(NestedRows);
registerPlugin(Filters);
registerPlugin(UndoRedo);

/**
 * Filtering a nested dataset keeps the parent-child tree (DEV-512): a matching child keeps its
 * whole ancestor chain, and a matching parent keeps its whole subtree.
 */
describe('NestedRows -> filtering', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid over an explicit dataset.
   *
   * @param {Array} data The dataset.
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(data, overrides = {}) {
    hot = new Handsontable(container, {
      data,
      filters: true,
      licenseKey: TEST_LICENSE_KEY,
      ...overrides,
    });

    return hot;
  }

  /**
   * Builds the tree: Parent A (rows 0-2) with two children, Parent B (rows 3-5) with a child that
   * has a child of its own.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Filters plugin.
   */
  function buildTree(overrides = {}) {
    return buildGrid([
      {
        name: 'Parent A',
        kind: 'group',
        __children: [{ name: 'Child A1', kind: 'leaf' }, { name: 'Child A2', kind: 'leaf' }],
      },
      {
        name: 'Parent B',
        kind: 'group',
        __children: [{ name: 'Child B1', kind: 'group', __children: [{ name: 'Grandchild B1a', kind: 'leaf' }] }],
      },
    ], {
      nestedRows: true,
      columns: [{ data: 'name' }, { data: 'kind' }],
      ...overrides,
    }).getPlugin('filters');
  }

  it('should keep the ancestors of a matching child', () => {
    const filters = buildTree();

    filters.addCondition(0, 'contains', ['child a1']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A1']);
  });

  it('should keep the whole ancestor chain of a matching grandchild', () => {
    const filters = buildTree();

    filters.addCondition(0, 'eq', ['Grandchild B1a']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent B', 'Child B1', 'Grandchild B1a']);
  });

  it('should keep the whole subtree of a matching parent', () => {
    const filters = buildTree();

    filters.addCondition(0, 'eq', ['Parent B']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent B', 'Child B1', 'Grandchild B1a']);
  });

  it('should keep a match inside a collapsed parent reachable', () => {
    const filters = buildTree();
    const nestedRows = hot.getPlugin('nestedRows');

    nestedRows.collapseParent(0); // Parent A
    filters.addCondition(0, 'contains', ['a2']);
    filters.filter();

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCol(0)).toEqual(['Parent A']);

    nestedRows.expandParent(0);

    expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A2']);
  });

  it('should keep the top-level parents visible on collapseAll while filtered', () => {
    const filters = buildTree();

    filters.addCondition(0, 'contains', ['child a1']);
    filters.filter();
    hot.getPlugin('nestedRows').collapsingUI.collapseAll();

    expect(hot.countRows()).toBeGreaterThan(0);
    expect(hot.getDataAtCol(0)).toEqual(['Parent A']);
  });

  it('should widen once, after every column\'s condition', () => {
    const filters = buildGrid([
      {
        name: 'Parent A',
        kind: 'x',
        __children: [{ name: 'Child A1', kind: 'y' }, { name: 'Child A2', kind: 'x' }],
      },
    ], {
      nestedRows: true,
      columns: [{ data: 'name' }, { data: 'kind' }],
    }).getPlugin('filters');
    const matchedRowsSpy = jasmine.createSpy('modifyFiltersMatchedRows');

    hot.addHook('modifyFiltersMatchedRows', matchedRowsSpy);

    // Widened per column, the `kind` match on Parent A would bring Child A1 back before the `name`
    // condition runs. Widened once, only Child A2 matches both, and it keeps its parent.
    filters.addCondition(1, 'eq', ['x']);
    filters.addCondition(0, 'contains', ['child']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A2']);
    expect(matchedRowsSpy).toHaveBeenCalledTimes(1);
    // The NestedRows listener runs first, so this listener sees its answer for the one match.
    expect(matchedRowsSpy.calls.argsFor(0)[0]).toEqual([0, 2]);
  });

  it('should list the values of kept ancestors in another column\'s list', () => {
    const filters = buildTree();

    filters.addCondition(0, 'contains', ['child a1']);
    filters.filter();

    // Column 1 has no condition of its own: it lists the rows the filter kept.
    expect(filters._getValueListDataAtColumn(1).map(({ value }) => value)).toEqual(['group', 'leaf']);

    // With a condition of its own, column 1 lists the rows column 0 keeps, widened the same way.
    filters.addCondition(1, 'eq', ['leaf']);
    filters.filter();

    expect(filters._getValueListDataAtColumn(1).map(({ value }) => value)).toEqual(['group', 'leaf']);
  });

  describe('a match through a blank cell', () => {
    /**
     * Builds the grid of the review report: two parents with no artist, their children carrying one.
     *
     * @param {object} [overrides] Settings merged over the defaults.
     * @returns {object} The Filters plugin.
     */
    function buildAwards(overrides = {}) {
      return buildGrid([
        {
          cat: 'Song',
          artist: null,
          __children: [{ artist: 'Alabama Shakes' }, { artist: 'Elle King' }],
        },
        {
          cat: 'Album',
          artist: null,
          __children: [{ artist: 'Muse' }],
        },
      ], {
        nestedRows: true,
        columns: [{ data: 'cat' }, { data: 'artist' }],
        ...overrides,
      }).getPlugin('filters');
    }

    it('should not keep the subtree of a parent that matches only through a blank cell', () => {
      const filters = buildAwards();

      filters.addCondition(1, 'by_value', [['', 'Elle King', 'Muse']]);
      filters.filter();

      // Unchecking "Alabama Shakes" while "(Blank cells)" stays checked must hide that artist.
      expect(hot.getDataAtCol(1)).toEqual([null, 'Elle King', null, 'Muse']);
    });

    it('should not keep the subtree of a blank parent that a non-by_value condition accepts', () => {
      const filters = buildAwards();

      filters.addCondition(1, 'neq', ['Alabama Shakes']);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual([null, 'Elle King', null, 'Muse']);
    });

    it('should still keep the subtree of a parent that matches a non-blank value', () => {
      const filters = buildAwards();

      filters.addCondition(0, 'by_value', [['Song']]);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual([null, 'Alabama Shakes', 'Elle King']);
    });

    it('should judge blankness on every conditioned column', () => {
      const filters = buildAwards();

      // Song matches the artist condition through a blank cell, but the category condition
      // through a value, so the match is not blank-only and keeps its subtree.
      filters.addCondition(0, 'by_value', [['Song']]);
      filters.addCondition(1, 'by_value', [['', 'Elle King', 'Muse']]);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual([null, 'Alabama Shakes', 'Elle King']);
    });

    it('should judge blankness on the condition subset of a value list', () => {
      const filters = buildGrid([
        {
          cat: null,
          artist: 'Various',
          __children: [{ cat: 'Rock', artist: 'Muse' }],
        },
      ], {
        nestedRows: true,
        dropdownMenu: true,
        columns: [{ data: 'cat' }, { data: 'artist' }],
      }).getPlugin('filters');
      const storedList = column => filters.components.get('filter_by_value')
        .state.getValueAtIndex(column).itemsSnapshot.map(({ value }) => value);

      // The parent matches column 0 only through its blank category. Column 1's list is built from
      // the column 0 conditions alone, so the parent is blank-only there - although its artist,
      // which column 1's own condition reads, is not blank.
      filters.addCondition(0, 'by_value', [['']]);
      filters.addCondition(1, 'by_value', [['Various', 'Muse']]);
      filters.filter();

      expect(filters._getValueListDataAtColumn(1).map(({ value }) => value)).toEqual(['Various']);
      expect(storedList(1)).toEqual(['Various']);
    });

    it('should not read cell values for the blank test on a grid with no listener', () => {
      const filters = buildGrid([['a', ''], ['', 'b'], ['a', 'c']]).getPlugin('filters');
      const readColumnSpy = jest.spyOn(filters, '_readColumn');

      filters.addCondition(0, 'by_value', [['', 'a']]);
      filters.addCondition(1, 'by_value', [['', 'b', 'c']]);
      readColumnSpy.mockClear();
      filters.filter();

      expect(hot.countRows()).toBe(3);
      // One read per conditioned column, by the conditions themselves - none for the blank test.
      expect(readColumnSpy.mock.calls.map(([column]) => column)).toEqual([0, 1]);
    });

    it('should hand the blank-only matches to a listener', () => {
      const filters = buildGrid([['a', ''], ['', 'b'], ['', ''], ['a', 'c']]).getPlugin('filters');
      const matchedRowsSpy = jasmine.createSpy('modifyFiltersMatchedRows');

      hot.addHook('modifyFiltersMatchedRows', matchedRowsSpy);
      filters.addCondition(0, 'by_value', [['', 'a']]);
      filters.addCondition(1, 'by_value', [['', 'b', 'c']]);
      filters.filter();

      expect(matchedRowsSpy).toHaveBeenCalledWith([0, 1, 2, 3], [2]);
    });
  });

  describe('the list of a column filtered by value', () => {
    /**
     * Reads the value list `updateState()` stored for a column that carries a by-value condition,
     * which is the list the menu restores for it.
     *
     * @param {object} filters The Filters plugin.
     * @param {number} column The physical column.
     * @returns {string[]} The listed values.
     */
    const storedList = (filters, column) => filters.components.get('filter_by_value')
      .state.getValueAtIndex(column).itemsSnapshot.map(({ value }) => value);

    it('should list the value of a kept ancestor', () => {
      const filters = buildTree({ dropdownMenu: true });

      filters.addCondition(0, 'contains', ['child a1']);
      filters.addCondition(1, 'by_value', [['leaf']]);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A1']);
      // Parent A is on screen, so its `group` must be a value the user can tick.
      expect(storedList(filters, 1)).toEqual(['group', 'leaf']);
    });

    it('should list the value of a kept ancestor after an earlier column\'s condition changes', () => {
      const filters = buildTree({ dropdownMenu: true });

      filters.addCondition(0, 'contains', ['child']);
      filters.addCondition(1, 'by_value', [['leaf']]);
      filters.filter();

      expect(filters.conditionCollection.getColumnStackPosition(1)).toBe(1);

      // A second condition on column 0 keeps its stack position, so column 1's list is refreshed
      // as a dependent column. Only Child A1 matches both, and it keeps Parent A.
      filters.addCondition(0, 'contains', ['a1']);
      filters.filter();

      expect(filters.conditionCollection.getColumnStackPosition(0)).toBe(0);
      expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A1']);
      expect(storedList(filters, 1)).toEqual(['group', 'leaf']);
    });
  });

  it('should restore the previous kept rows on undo', () => {
    const filters = buildTree({ undo: true });

    filters.addCondition(0, 'contains', ['child a1']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A1']);

    filters.clearConditions();
    filters.addCondition(0, 'eq', ['Parent B']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent B', 'Child B1', 'Grandchild B1a']);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCol(0)).toEqual(['Parent A', 'Child A1']);

    hot.getPlugin('undoRedo').redo();

    expect(hot.getDataAtCol(0)).toEqual(['Parent B', 'Child B1', 'Grandchild B1a']);
  });

  it('should show every row again once the conditions are cleared', () => {
    const filters = buildTree();

    filters.addCondition(0, 'contains', ['child a1']);
    filters.filter();
    filters.clearConditions();
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual([
      'Parent A', 'Child A1', 'Child A2', 'Parent B', 'Child B1', 'Grandchild B1a',
    ]);
  });

  it('should keep only the matches once the plugin is disabled', () => {
    const filters = buildTree();

    hot.updateSettings({ nestedRows: false });

    // The tree is not flattened any more, so the grid has two rows. A listener left behind would
    // still widen physical row 0 to its old subtree and bring row 1 back.
    filters.addCondition(0, 'eq', ['Parent A']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['Parent A']);
  });

  it('should read fresh set positions from afterRowSequenceCacheUpdate', () => {
    const filters = buildTree();
    const { dataManager } = hot.getPlugin('nestedRows');
    const positions = [];

    filters.addCondition(0, 'contains', ['child a']);
    filters.filter();

    // Child A2 (physical row 2) is the 2nd of 2 reachable siblings; this read fills the cache.
    expect(dataManager.getRowSetPosition(2)).toEqual({ position: 2, setSize: 2 });

    hot.addHook('afterRowSequenceCacheUpdate', () => {
      positions.push(dataManager.getRowSetPosition(2));
    });

    filters.removeConditions(0);
    filters.addCondition(0, 'eq', ['Child A2']);
    filters.filter();

    // Child A1 is gone, so Child A2 is the only reachable sibling now.
    expect(positions[positions.length - 1]).toEqual({ position: 1, setSize: 1 });
  });

  it('should not leave a row index cache listener behind across disable and enable', () => {
    buildTree();

    const countCacheListeners = () => (hot.rowIndexMapper._localHooks.cacheUpdated?.length ?? 0) +
      (hot.rowIndexMapper._localHooks.beforeCacheUpdate?.length ?? 0);
    const listenersWhileEnabled = countCacheListeners();

    for (let cycle = 0; cycle < 3; cycle++) {
      hot.updateSettings({ nestedRows: false });

      expect(countCacheListeners()).toBe(listenersWhileEnabled - 2);

      hot.updateSettings({ nestedRows: true });

      expect(countCacheListeners()).toBe(listenersWhileEnabled);
    }
  });

  describe('the modifyFiltersMatchedRows hook', () => {
    it('should keep the matches when a listener returns nothing', () => {
      const filters = buildGrid([['Parent A'], ['Child A1'], ['Child A2'], ['Parent B']]).getPlugin('filters');
      const matchedRowsSpy = jasmine.createSpy('modifyFiltersMatchedRows');

      hot.addHook('modifyFiltersMatchedRows', matchedRowsSpy);
      filters.addCondition(0, 'contains', ['child a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Child A1', 'Child A2']);
      expect(matchedRowsSpy).toHaveBeenCalledWith([1, 2], []);
    });

    it('should not run the hook on a grid with no listener', () => {
      const filters = buildGrid([['Parent A'], ['Child A1'], ['Child A2'], ['Parent B']]).getPlugin('filters');
      const runHooksSpy = jest.spyOn(hot, 'runHooks');

      filters.addCondition(0, 'contains', ['child a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Child A1', 'Child A2']);
      expect(runHooksSpy.mock.calls.filter(([hookName]) => hookName === 'modifyFiltersMatchedRows')).toEqual([]);
    });

    it('should normalize a replacement list a listener returns', () => {
      const filters = buildGrid([['a'], ['b'], ['c'], ['d']]).getPlugin('filters');

      hot.addHook('modifyFiltersMatchedRows', () => [3, 1, 1, -1, 4, 2.5, '0', null, Number.NaN]);
      filters.addCondition(0, 'eq', ['a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['b', 'd']);
    });

    it('should keep the matches when a listener returns a non-array value', () => {
      const filters = buildGrid([['a'], ['b'], ['a']]).getPlugin('filters');

      hot.addHook('modifyFiltersMatchedRows', () => 'not an array');
      filters.addCondition(0, 'eq', ['a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['a', 'a']);
    });
  });
});
