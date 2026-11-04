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

  describe('the modifyFiltersMatchedRows hook', () => {
    it('should leave a grid without nestedRows unchanged', () => {
      const filters = buildGrid([['Parent A'], ['Child A1'], ['Child A2'], ['Parent B']]).getPlugin('filters');
      const matchedRowsSpy = jasmine.createSpy('modifyFiltersMatchedRows');

      hot.addHook('modifyFiltersMatchedRows', matchedRowsSpy);
      filters.addCondition(0, 'contains', ['child a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Child A1', 'Child A2']);
      expect(matchedRowsSpy).toHaveBeenCalledWith([1, 2]);
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
