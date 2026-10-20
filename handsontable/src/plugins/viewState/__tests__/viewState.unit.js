import Handsontable from '../../../base';
import { registerPlugin } from '../../../plugins/registry';
import { ManualColumnResize } from '../../../plugins/manualColumnResize';
import { ManualRowResize } from '../../../plugins/manualRowResize';
import { ColumnSorting } from '../../../plugins/columnSorting';
import { Filters } from '../../../plugins/filters';
import { HiddenRows } from '../../../plugins/hiddenRows';
import { HiddenColumns } from '../../../plugins/hiddenColumns';
import { TrimRows } from '../../../plugins/trimRows';
import { Pagination } from '../../../plugins/pagination';
import { UndoRedo } from '../../../plugins/undoRedo';
import { ViewState } from '../viewState';
import { NestedRows } from '../../../plugins/nestedRows';
import { MultiColumnSorting } from '../../../plugins/multiColumnSorting';
import { DropdownMenu } from '../../../plugins/dropdownMenu';
import { AutoColumnSize } from '../../../plugins/autoColumnSize';
import { registerCellType, CheckboxCellType } from '../../../cellTypes';
import * as consoleHelpers from '../../../helpers/console';

/**
 * Builds a 6x4 data set whose cells name their own source position.
 */
function createData() {
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 4 }, (__, col) => `${row}-${col}`));
}

/**
 * Returns the ViewState plugin of a grid.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {object}
 */
function vs(hot) {
  return hot.getPlugin('viewState');
}

/**
 * Reduces the skipped entries to the part and the reason, for the cases that do not pin the wording.
 * @param skipped
 */
function brief(skipped) {
  return skipped.map(({ part, reason }) => ({ part, reason }));
}

/**
 * Sends a view state through JSON, the way an application stores it.
 * @param state
 */
function throughJson(state) {
  return JSON.parse(JSON.stringify(state));
}

describe('ViewState plugin', () => {
  const containers = [];
  const instances = [];

  beforeAll(() => {
    registerPlugin(ManualColumnResize);
    registerPlugin(ManualRowResize);
    registerPlugin(ColumnSorting);
    registerPlugin(Filters);
    registerPlugin(HiddenRows);
    registerPlugin(HiddenColumns);
    registerPlugin(TrimRows);
    registerPlugin(Pagination);
    registerPlugin(UndoRedo);
    registerPlugin(ViewState);
    registerPlugin(NestedRows);
    registerPlugin(MultiColumnSorting);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerCellType(CheckboxCellType);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    instances.splice(0).forEach(hot => hot.destroy());
    containers.splice(0).forEach(container => container.remove());
  });

  /**
   * Creates a grid over a fresh copy of the data set.
   * @param settings
   */
  function createGrid(settings = {}) {
    const container = document.createElement('div');

    document.body.appendChild(container);
    containers.push(container);

    const hot = new Handsontable(container, {
      data: createData(),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    instances.push(hot);

    return hot;
  }

  const ALL_PLUGINS = {
    manualColumnResize: true,
    manualRowResize: true,
    columnSorting: true,
    filters: true,
    hiddenRows: true,
    hiddenColumns: true,
    trimRows: true,
  };

  describe('the plugin', () => {
    it('is on without a setting, and has none', () => {
      const hot = createGrid();
      const plugin = hot.getPlugin('viewState');

      expect(plugin.isEnabled()).toBe(true);
      expect(plugin.enabled).toBe(true);
      expect(ViewState.SETTING_KEYS).toEqual([]);
      expect(Object.keys(hot.getSettings())).not.toContain('viewState');
    });

    it('keeps working after an updateSettings() call and a disable and enable cycle', () => {
      const hot = createGrid(ALL_PLUGINS);
      const plugin = hot.getPlugin('viewState');

      hot.updateSettings({ colHeaders: true });
      plugin.disablePlugin();
      plugin.enablePlugin();

      expect(plugin.setViewState({ version: 1, hiddenColumns: [1] }).applied).toEqual(['hiddenColumns']);
      expect(plugin.getViewState().hiddenColumns).toEqual([1]);
    });
  });

  describe('getViewState()', () => {
    it('returns plain data that survives JSON unchanged', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.getPlugin('hiddenColumns').hideColumn(2);
      hot.selectCell(1, 1, 2, 3);

      const state = vs(hot).getViewState();

      expect(state.version).toBe(1);
      expect(throughJson(state)).toEqual(state);
    });

    it('leaves out the parts whose plugin is disabled', () => {
      const hot = createGrid();
      const state = vs(hot).getViewState();

      expect(Object.keys(state)).not.toContain('sort');
      expect(Object.keys(state)).not.toContain('filters');
      expect(Object.keys(state)).not.toContain('hiddenRows');
      expect(Object.keys(state)).not.toContain('hiddenColumns');
      expect(Object.keys(state)).not.toContain('trimmedRows');
      expect(Object.keys(state)).not.toContain('columnWidths');
      expect(Object.keys(state)).not.toContain('rowHeights');
      expect(Object.keys(state)).not.toContain('pagination');
      expect(state.columnOrder).toEqual([0, 1, 2, 3]);
      expect(state.frozen).toEqual({ rowsTop: 0, rowsBottom: 0, columnsStart: 0, columnsEnd: 0 });
      expect(state.selection).toBeNull();
    });

    it('does not share arrays with the grid', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('hiddenRows').hideRow(1);

      const state = vs(hot).getViewState();

      state.hiddenRows.push(4);
      state.columnOrder.reverse();

      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([1]);
      expect(hot.columnIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3]);
    });
  });

  describe('round trip through JSON onto another grid', () => {
    it('restores the sort', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const result = vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(brief(result.skipped)).toEqual([]);
      expect(target.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
      expect(target.getDataAtCol(1)).toEqual(source.getDataAtCol(1));
      expect(target.getDataAtCell(0, 1)).toBe('5-1');
    });

    it('restores the filters', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);
      const filters = source.getPlugin('filters');

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getPlugin('filters').exportConditions()).toEqual(filters.exportConditions());
      expect(target.getData()).toEqual([['2-0', '2-1', '2-2', '2-3']]);
    });

    it('restores the hidden rows and columns by their physical indexes', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('hiddenRows').hideRows([1, 3]);
      source.getPlugin('hiddenColumns').hideColumns([0, 2]);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getPlugin('hiddenRows').getHiddenRows()).toEqual([1, 3]);
      expect(target.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0, 2]);
    });

    it('restores the trimmed rows', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('trimRows').trimRows([0, 5]);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getPlugin('trimRows').getTrimmedRows()).toEqual([0, 5]);
      expect(target.countRows()).toBe(4);
    });

    it('restores the row and column order', () => {
      const source = createGrid();
      const target = createGrid();

      source.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      source.rowIndexMapper.setIndexesSequence([5, 4, 3, 2, 1, 0]);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.columnIndexMapper.getIndexesSequence()).toEqual([3, 2, 1, 0]);
      expect(target.rowIndexMapper.getIndexesSequence()).toEqual([5, 4, 3, 2, 1, 0]);
      expect(target.getDataAtCell(0, 0)).toBe('5-3');
    });

    it('restores the manual column widths and row heights', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('manualColumnResize').setManualSize(1, 180);
      source.getPlugin('manualRowResize').setManualSize(2, 64);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getColWidth(1)).toBe(180);
      expect(target.getRowHeight(2)).toBe(64);
    });

    it('restores the frozen rows and columns', () => {
      const source = createGrid({ fixedRowsTop: 1, fixedRowsBottom: 2, fixedColumnsStart: 2, fixedColumnsEnd: 1 });
      const target = createGrid();

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getSettings().fixedRowsTop).toBe(1);
      expect(target.getSettings().fixedRowsBottom).toBe(2);
      expect(target.getSettings().fixedColumnsStart).toBe(2);
      expect(target.getSettings().fixedColumnsEnd).toBe(1);
      expect(target.view.countFixedColumnsStart()).toBe(2);
    });

    it('restores the pagination page and page size', () => {
      const source = createGrid({ pagination: { pageSize: 2 } });
      const target = createGrid({ pagination: { pageSize: 5 } });

      source.getPlugin('pagination').setPage(3);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getPlugin('pagination').getCurrentPageSize()).toBe(2);
      expect(target.getPlugin('pagination').getCurrentPage()).toBe(3);
    });

    it('restores a multi-layer cell selection with its focus', () => {
      const source = createGrid();
      const target = createGrid();

      source.selectCells([[0, 0, 1, 1], [3, 2, 4, 3]]);
      source.selection.setRangeFocus(source._createCellCoords(4, 3), 1);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getSelected()).toEqual([[0, 0, 1, 1], [3, 2, 4, 3]]);
      expect(target.getSelectedRangeActive().highlight.toObject()).toEqual({ row: 4, col: 3 });
    });

    it('restores a whole-column selection as one', () => {
      const source = createGrid({ colHeaders: true });
      const target = createGrid({ colHeaders: true });

      source.selectColumns(1, 2);

      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getSelected()).toEqual(source.getSelected());
      expect(target.selection.isSelectedByColumnHeader()).toBe(true);
    });

    it('clears the selection for a state captured with nothing selected', () => {
      const source = createGrid();
      const target = createGrid();

      target.selectCell(1, 1);
      vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(target.getSelected()).toBeUndefined();
    });
  });

  describe('setViewState() with a partial state', () => {
    it('leaves the parts the state does not carry as they are', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('hiddenRows').hideRow(2);
      hot.getPlugin('manualColumnResize').setManualSize(0, 150);
      hot.selectCell(1, 1);

      const result = vs(hot).setViewState({ version: 1, sort: { columns: [{ column: 0, sortOrder: 'desc' }] } });

      expect(brief(result.skipped)).toEqual([]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows().map(row => hot.toPhysicalRow(row))).toEqual([2]);
      expect(hot.getColWidth(0)).toBe(150);
      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('sorts from the current order when the state names no pre-sort order', () => {
      const hot = createGrid(ALL_PLUGINS);

      vs(hot).setViewState({ version: 1, sort: { columns: [{ column: 0, sortOrder: 'desc' }] } });
      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getDataAtCol(0)).toEqual(['0-0', '1-0', '2-0', '3-0', '4-0', '5-0']);
    });

    it('keeps the row heights when only the column widths are restored', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('manualRowResize').setManualSize(1, 70);
      vs(hot).setViewState({ version: 1, columnWidths: [[0, 120]] });

      expect(hot.getColWidth(0)).toBe(120);
      expect(hot.getRowHeight(1)).toBe(70);
    });
  });

  describe('setViewState() reporting', () => {
    it('skips the parts whose plugin is disabled, without throwing', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid();

      source.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      source.getPlugin('hiddenColumns').hideColumn(1);

      const { skipped } = vs(target).setViewState(throughJson(vs(source).getViewState()));

      expect(brief(skipped)).toEqual(expect.arrayContaining([
        { part: 'sort', reason: 'pluginDisabled' },
        { part: 'hiddenColumns', reason: 'pluginDisabled' },
        { part: 'filters', reason: 'pluginDisabled' },
      ]));
      // The row order is a part of its own, so the rows still come in the sorted order.
      expect(target.getDataAtCol(0)).toEqual(source.getDataAtCol(0));
    });

    it('skips an order whose length no longer matches the data', () => {
      const hot = createGrid();

      const { skipped } = vs(hot).setViewState({ version: 1, columnOrder: [1, 0], rowOrder: [5, 4, 3, 2, 1, 0] });

      expect(brief(skipped)).toEqual([{ part: 'columnOrder', reason: 'sizeMismatch' }]);
      expect(hot.columnIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3]);
      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([5, 4, 3, 2, 1, 0]);
    });

    it('skips a selection that does not fit the grid', () => {
      const hot = createGrid();
      const selection = {
        ranges: [{ from: [10, 0], to: [10, 0], highlight: [10, 0] }],
        activeLayer: 0,
        selectedByRowHeader: [],
        selectedByColumnHeader: [],
        rowExtentSpansGrid: [],
        columnExtentSpansGrid: [],
        disableHeadersHighlight: false,
      };

      const { skipped } = vs(hot).setViewState({ version: 1, selection });

      expect(brief(skipped)).toEqual([{ part: 'selection', reason: 'outOfRange' }]);
      expect(hot.getSelected()).toBeUndefined();
    });

    it('skips a part with the wrong shape and applies the rest', () => {
      const hot = createGrid(ALL_PLUGINS);

      const { skipped } = vs(hot).setViewState({
        version: 1,
        hiddenRows: ['1'],
        sort: { columns: [{ column: 0, sortOrder: 'sideways' }] },
        hiddenColumns: [3],
      });

      expect(brief(skipped)).toEqual([
        { part: 'sort', reason: 'invalid' },
        { part: 'hiddenRows', reason: 'invalid' },
      ]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([3]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
    });

    it('applies nothing for an unsupported version, and warns', () => {
      const warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
      const hot = createGrid(ALL_PLUGINS);

      const { skipped } = vs(hot).setViewState({ version: 2, hiddenRows: [1] });

      expect(brief(skipped)).toEqual([{ part: 'hiddenRows', reason: 'unsupportedVersion' }]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo', () => {
    it('records no undo step for the restore', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        filters: [{ column: 1, operation: 'conjunction', conditions: [{ name: 'neq', args: ['3-1'] }] }],
      });

      expect(undoRedo.isUndoAvailable()).toBe(false);
      expect(undoRedo.ignoreNewActions).toBe(false);
    });

    it('records no undo step for a restore of every part, including rows written to the hiding map', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true, pagination: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'neq', ['4-0']);
      filters.filter();
      undoRedo.clear();

      const { skipped } = vs(hot).setViewState({
        version: 1,
        columnOrder: [3, 2, 1, 0],
        rowOrder: [5, 4, 3, 2, 1, 0],
        sort: { columns: [{ column: 1, sortOrder: 'asc' }] },
        filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'neq', args: ['4-0'] }] }],
        trimmedRows: [5],
        hiddenRows: [1, 4],
        hiddenColumns: [2],
        columnWidths: [[0, 90]],
        rowHeights: [[1, 40]],
        frozen: { rowsTop: 0, rowsBottom: 0, columnsStart: 1, columnsEnd: 0 },
        pagination: { page: 1, pageSize: 3 },
        selection: null,
        scroll: { row: 0, col: 0 },
      });

      expect(brief(skipped)).toEqual([]);
      expect(vs(hot).getViewState().hiddenRows).toEqual([1, 4]);
      expect(undoRedo.isUndoAvailable()).toBe(false);
    });

    it('keeps the undo steps recorded before the restore', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      vs(hot).setViewState({ version: 1, hiddenColumns: [3] });
      undoRedo.undo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('0-0');
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([3]);
    });
  });

  describe('physical indexes', () => {
    it('keeps the hidden indexes and sizes on their records when the grids order them differently', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.rowIndexMapper.setIndexesSequence([5, 4, 3, 2, 1, 0]);
      source.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      source.getPlugin('hiddenRows').hideRow(0); // physical row 5
      source.getPlugin('hiddenColumns').hideColumn(0); // physical column 3
      source.getPlugin('manualColumnResize').setManualSize(1, 175); // physical column 2

      const state = throughJson(vs(source).getViewState());

      expect(state.hiddenRows).toEqual([5]);
      expect(state.hiddenColumns).toEqual([3]);
      expect(state.columnWidths).toEqual([[2, 175]]);

      // The target keeps its own order: the parts must land on the same records, not positions.
      const { columnOrder, rowOrder, ...rest } = state;

      vs(target).setViewState(rest);

      expect(target.getPlugin('hiddenRows').getHiddenRows()).toEqual([5]);
      expect(target.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([3]);
      expect(target.getColWidth(2)).toBe(175);
    });
  });

  describe('hidden rows on a trimmed grid', () => {
    it('shows a hidden row again even while a filter trims another hidden row', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      hot.getPlugin('hiddenRows').hideRows([1, 4]);
      filters.addCondition(0, 'neq', ['4-0']);
      filters.filter();

      const { skipped } = vs(hot).setViewState({ version: 1, hiddenRows: [] });

      expect(brief(skipped)).toEqual([]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);

      filters.clearConditions();
      filters.filter();

      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
    });

    it('hides a row a filter trims now, so it stays hidden once the filter lifts', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'neq', ['4-0']);
      filters.filter();
      vs(hot).setViewState({ version: 1, hiddenRows: [2, 4] });
      filters.clearConditions();
      filters.filter();

      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([2, 4]);
    });
  });

  describe('collapsed nested rows', () => {
    /**
     * Builds a two-branch tree: parents at physical 0 and 3, two children each.
     */
    function createTree() {
      return [
        { name: 'A', __children: [{ name: 'A1' }, { name: 'A2' }] },
        { name: 'B', __children: [{ name: 'B1' }, { name: 'B2' }] },
      ];
    }

    it('round-trips the collapsed parents', () => {
      const source = createGrid({ data: createTree(), nestedRows: true, rowHeaders: true });
      const target = createGrid({ data: createTree(), nestedRows: true, rowHeaders: true });

      source.getPlugin('nestedRows').collapsingUI.collapseChildren(3);

      const state = throughJson(vs(source).getViewState());

      expect(state.collapsedRows).toEqual([[1]]);
      expect(brief(vs(target).setViewState(state).skipped)).toEqual([]);
      expect(target.getPlugin('nestedRows').getCollapsedParents()).toEqual([3]);
      expect(target.countRows()).toBe(4);
    });

    it('replaces the collapsed parents rather than adding to them', () => {
      const hot = createGrid({ data: createTree(), nestedRows: true, rowHeaders: true });

      hot.getPlugin('nestedRows').collapsingUI.collapseChildren(0);
      vs(hot).setViewState({ version: 1, collapsedRows: [[1]] });

      expect(hot.getPlugin('nestedRows').getCollapsedParents()).toEqual([3]);
    });
  });

  describe('a grid with an external data source', () => {
    it('leaves out and skips the sort, the filters, and the page', () => {
      const hot = createGrid({ ...ALL_PLUGINS, pagination: true });

      hot.addHook('hasExternalDataSource', () => true);

      const state = vs(hot).getViewState();

      expect(Object.keys(state)).not.toContain('sort');
      expect(Object.keys(state)).not.toContain('filters');
      expect(Object.keys(state)).not.toContain('pagination');

      const { skipped } = vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        filters: [],
        pagination: { page: 1, pageSize: 2 },
        hiddenColumns: [1],
      });

      expect(brief(skipped)).toEqual([
        { part: 'sort', reason: 'externalDataSource' },
        { part: 'filters', reason: 'externalDataSource' },
        { part: 'pagination', reason: 'externalDataSource' },
      ]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
    });
  });

  describe('setViewState() validation', () => {
    const selectionOf = overrides => ({
      ranges: [{ from: [0, 0], to: [0, 0], highlight: [0, 0] }],
      activeLayer: 0,
      selectedByRowHeader: [],
      selectedByColumnHeader: [],
      rowExtentSpansGrid: [],
      columnExtentSpansGrid: [],
      disableHeadersHighlight: false,
      ...overrides,
    });

    it.each([
      ['rowOrder', [0, 0, 1, 2, 3, 4]],
      ['rowOrder', [0, 1, 2, 3, 4, 99]],
      ['rowOrder', [-1, 1, 2, 3, 4, 5]],
      ['columnOrder', [0, 1, 1, 2]],
      ['hiddenRows', [-1]],
      ['hiddenColumns', [1.5]],
      ['trimmedRows', [-1]],
      ['columnWidths', [[0, 0]]],
      ['columnWidths', [[-1, 50]]],
      ['rowHeights', [[0]]],
      ['frozen', { rowsTop: -1, rowsBottom: 0, columnsStart: 0, columnsEnd: 0 }],
      ['frozen', { rowsTop: 1, rowsBottom: 0, columnsStart: 0 }],
      ['pagination', { page: 0, pageSize: 10 }],
      ['pagination', { page: 1, pageSize: 'all' }],
      ['scroll', { row: -1, col: 0 }],
      ['selection', selectionOf({ activeLayer: 1 })],
      ['selection', selectionOf({ ranges: [{ from: [0, 0], to: [0, 0] }] })],
      ['selection', selectionOf({ selectedByRowHeader: [-1] })],
      ['selection', selectionOf({ disableHeadersHighlight: 'no' })],
      ['sort', { columns: [{ column: -1, sortOrder: 'asc' }] }],
      ['sort', { columns: [{ column: 0, sortOrder: 'none' }] }],
      ['sort', { columns: [{ column: 0, sortOrder: 'asc' }, { column: 1, sortOrder: 'desc' }] }],
      ['filters', [{ column: 0, operation: 'and', conditions: [{ name: 'eq', args: ['0-0'] }] }]],
      ['filters', [{ column: 0, operation: 'conjunction', conditions: [{ name: 'nope', args: [] }] }]],
      ['filters', [{ column: 9, operation: 'conjunction', conditions: [{ name: 'eq', args: ['x'] }] }]],
      ['filters', [
        { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['0-0'] }] },
        { column: 0, operation: 'disjunction', conditions: [{ name: 'eq', args: ['1-0'] }] },
      ]],
      ['filters', [{ column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: 'x' }] }]],
      ['collapsedRows', [[-1]]],
    ])('reports a malformed %s as invalid, applies nothing for it, and does not throw', (part, value) => {
      const hot = createGrid({ ...ALL_PLUGINS, pagination: true, nestedRows: false });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const before = vs(hot).getViewState();
      const { skipped } = vs(hot).setViewState({ version: 1, [part]: value });

      expect(brief(skipped)).toEqual([{ part, reason: part === 'collapsedRows' ? 'pluginDisabled' : 'invalid' }]);
      expect(vs(hot).getViewState()).toEqual(before);
    });

    it('accepts several sort columns when MultiColumnSorting is on', () => {
      const hot = createGrid({ multiColumnSorting: true });
      const columns = [{ column: 1, sortOrder: 'desc' }, { column: 0, sortOrder: 'asc' }];

      expect(brief(vs(hot).setViewState({ version: 1, sort: { columns } }).skipped)).toEqual([]);
      expect(hot.getPlugin('multiColumnSorting').getSortConfig()).toEqual(columns);
    });

    it('keeps the current filter when the stored one cannot be imported', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      const { skipped } = vs(hot).setViewState({
        version: 1,
        filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'custom-gone', args: [] }] }],
      });

      expect(brief(skipped)).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(filters.exportConditions()).toEqual([
        { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['2-0'] }] },
      ]);
      expect(hot.getData()).toEqual([['2-0', '2-1', '2-2', '2-3']]);
    });
  });

  describe('review follow-ups', () => {
    it('reports the applied parts', () => {
      const hot = createGrid(ALL_PLUGINS);

      const result = vs(hot).setViewState({
        version: 1,
        hiddenColumns: [1],
        hiddenRows: [-1],
        scroll: { row: 0, col: 0 },
      });

      expect(result.applied).toEqual(['hiddenColumns', 'scroll']);
      expect(brief(result.skipped)).toEqual([{ part: 'hiddenRows', reason: 'invalid' }]);
    });

    it('applies nothing and warns plainly for a state that is not an object', () => {
      const warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('hiddenColumns').hideColumn(1);

      expect(vs(hot).setViewState(null)).toMatchObject({ applied: [], skipped: [], error: { reason: 'notAnObject' } });
      expect(vs(hot).setViewState('{}')).toMatchObject({ applied: [], skipped: [], error: { reason: 'notAnObject' } });
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0][0]).toContain('expected a view state object, got null');
      expect(warnSpy.mock.calls[0][0]).not.toContain('version');
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
    });

    it('rejects condition arguments the condition cannot take, and keeps the current filter', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      const { skipped } = vs(hot).setViewState({
        version: 1,
        filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'by_value', args: [5] }] }],
      });

      expect(brief(skipped)).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(filters.exportConditions()).toEqual([
        { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['2-0'] }] },
      ]);
      expect(hot.getData()).toEqual([['2-0', '2-1', '2-2', '2-3']]);
    });

    it('skips frozen rows on a paginated grid, as a conflict, and applies them without Pagination', () => {
      const paginated = createGrid({ pagination: true });
      const plain = createGrid();
      const frozen = { rowsTop: 1, rowsBottom: 0, columnsStart: 1, columnsEnd: 0 };

      expect(brief(vs(paginated).setViewState({ version: 1, frozen }).skipped)).toEqual([
        { part: 'frozen', reason: 'pluginConflict' },
      ]);
      expect(paginated.getSettings().fixedRowsTop).toBeFalsy();
      expect(paginated.getPlugin('pagination').enabled).toBe(true);

      expect(brief(vs(plain).setViewState({ version: 1, frozen }).skipped)).toEqual([]);
      expect(plain.getSettings().fixedRowsTop).toBe(1);
    });

    it('accepts frozen columns on a paginated grid', () => {
      const hot = createGrid({ pagination: true });

      expect(vs(hot).setViewState({
        version: 1,
        frozen: { rowsTop: 0, rowsBottom: 0, columnsStart: 2, columnsEnd: 0 },
      }).skipped).toEqual([]);
      expect(hot.getSettings().fixedColumnsStart).toBe(2);
    });

    it('clears the sort when it restores a row order the state gives no sort for', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      vs(hot).setViewState({ version: 1, rowOrder: [1, 0, 2, 3, 4, 5] });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([1, 0, 2, 3, 4, 5]);
    });

    it('keeps the current sort when the state carries a sort and a row order', () => {
      const hot = createGrid(ALL_PLUGINS);

      vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        rowOrder: [5, 4, 3, 2, 1, 0],
      });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
    });

    it('changes no hidden row when a hiding hook vetoes the change', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      hot.getPlugin('hiddenRows').hideRows([1, 4]);
      filters.addCondition(0, 'neq', ['4-0']);
      filters.filter();
      hot.addHook('beforeHideRows', () => false);

      vs(hot).setViewState({ version: 1, hiddenRows: [1, 2, 4] });

      expect(vs(hot).getViewState().hiddenRows).toEqual([1, 4]);
    });

    it('runs the hiding hooks for the rows a restore shows and hides', () => {
      const hot = createGrid(ALL_PLUGINS);
      const afterHide = jest.fn();
      const afterUnhide = jest.fn();

      hot.addHook('afterHideRows', afterHide);
      hot.addHook('afterUnhideRows', afterUnhide);
      vs(hot).setViewState({ version: 1, hiddenRows: [1] });
      vs(hot).setViewState({ version: 1, hiddenRows: [] });

      expect(afterHide).toHaveBeenCalledTimes(1);
      expect(afterUnhide).toHaveBeenCalledTimes(1);
    });

    it('renders once for a state that carries only a scroll position', () => {
      const hot = createGrid(ALL_PLUGINS);
      const afterRender = jest.fn();

      hot.addHook('afterRender', afterRender);
      vs(hot).setViewState({ version: 1, scroll: { row: 0, col: 0 } });

      expect(afterRender.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('does not record a held validation of the restore as an undo step', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      vs(hot).setViewState({ version: 1, hiddenRows: [1], columnWidths: [[0, 90]] });

      expect(undoRedo.isUndoAvailable()).toBe(false);
    });
  });

  describe('undo option', () => {
    const everyPart = {
      version: 1,
      columnOrder: [3, 2, 1, 0],
      sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
      filters: [{ column: 1, operation: 'conjunction', conditions: [{ name: 'neq', args: ['3-2'] }] }],
      hiddenColumns: [3],
      columnWidths: [[0, 90]],
      frozen: { rowsTop: 1, rowsBottom: 0, columnsStart: 1, columnsEnd: 0 },
    };

    /**
     * Reads the view the parts of `everyPart` describe, in the public shape.
     * @param hot
     */
    function readView(hot) {
      const { columnOrder, sort, filters, hiddenColumns, columnWidths, frozen } = vs(hot).getViewState();

      return { columnOrder, sort, filters, hiddenColumns, columnWidths, frozen };
    }

    it('records the restore as one undo step that one undo reverts and one redo applies again', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const before = readView(hot);

      expect(vs(hot).setViewState(everyPart, { undo: 'record' }).skipped).toEqual([]);

      const restored = readView(hot);

      expect(restored).not.toEqual(before);
      expect(undoRedo.isUndoAvailable()).toBe(true);

      undoRedo.undo();

      expect(readView(hot)).toEqual(before);
      expect(undoRedo.isUndoAvailable()).toBe(false);

      undoRedo.redo();

      expect(readView(hot)).toEqual(restored);
    });

    it('records nothing by default, and with undo: skip', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      vs(hot).setViewState(everyPart);
      expect(undoRedo.isUndoAvailable()).toBe(false);

      vs(hot).setViewState({ version: 1, hiddenColumns: [1] }, { undo: 'skip' });
      expect(undoRedo.isUndoAvailable()).toBe(false);
    });

    it('lets an undo after a recorded restore reach the edit made before it only on the second undo', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      vs(hot).setViewState({ version: 1, hiddenColumns: [3] }, { undo: 'record' });
      undoRedo.undo();

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('edited');

      undoRedo.undo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('0-0');
    });

    it('returns the previous view of the restored parts, and passing it back reverts them', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('hiddenColumns').hideColumn(1);
      hot.getPlugin('manualColumnResize').setManualSize(2, 140);

      const before = readView(hot);
      const { previous, applied } = vs(hot).setViewState(everyPart);

      expect(applied).toEqual(['columnOrder', 'sort', 'filters', 'hiddenColumns', 'columnWidths', 'frozen']);
      expect(previous.hiddenColumns).toEqual([1]);
      expect(previous.columnWidths).toEqual([[2, 140]]);
      expect(Object.keys(previous).sort()).toEqual(['version', ...applied].sort());
      expect(throughJson(previous)).toEqual(previous);

      expect(vs(hot).setViewState(previous).skipped).toEqual([]);
      expect(readView(hot)).toEqual(before);
    });

    it('returns no previous view when nothing was applied', () => {
      const hot = createGrid();

      expect(vs(hot).setViewState({ version: 1, hiddenColumns: [1] }).previous).toBeUndefined();
    });
  });

  describe('atomic apply and validateViewState()', () => {
    const goodAndBad = {
      version: 1,
      hiddenColumns: [2],
      columnWidths: [[0, 80]],
      filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'by_value', args: [5] }] }],
    };

    it('applies nothing when atomic and one part is rejected', () => {
      const hot = createGrid(ALL_PLUGINS);
      const before = vs(hot).getViewState();
      const result = vs(hot).setViewState(goodAndBad, { atomic: true });

      expect(result.applied).toEqual([]);
      expect(result.previous).toBeUndefined();
      expect(brief(result.skipped)).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(result.error).toEqual({
        reason: 'atomicRejected',
        message: '1 of 3 parts cannot be applied, so nothing was applied',
      });
      expect(vs(hot).getViewState()).toEqual(before);
    });

    it('applies the good parts when not atomic, and reports the bad one', () => {
      const hot = createGrid(ALL_PLUGINS);
      const result = vs(hot).setViewState(goodAndBad);

      expect(result.applied).toEqual(['hiddenColumns', 'columnWidths']);
      expect(brief(result.skipped)).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(result.error).toBeUndefined();
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
    });

    it('applies an atomic state that is entirely valid', () => {
      const hot = createGrid(ALL_PLUGINS);
      const result = vs(hot)
        .setViewState({ version: 1, hiddenColumns: [2], columnWidths: [[0, 80]] }, { atomic: true });

      expect(result.applied).toEqual(['hiddenColumns', 'columnWidths']);
      expect(result.error).toBeUndefined();
    });

    it('validates without applying anything', () => {
      const hot = createGrid(ALL_PLUGINS);
      const before = vs(hot).getViewState();
      const afterRender = jest.fn();

      hot.addHook('afterRender', afterRender);

      const result = vs(hot).validateViewState(goodAndBad);

      expect(result.valid).toBe(false);
      expect(result.applicable).toEqual(['hiddenColumns', 'columnWidths']);
      expect(brief(result.skipped)).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(vs(hot).getViewState()).toEqual(before);
      expect(afterRender).not.toHaveBeenCalled();
    });

    it('answers the same as setViewState() does, for a valid and a rejected state', () => {
      const hot = createGrid(ALL_PLUGINS);
      const states = [{ version: 1, hiddenColumns: [1] }, goodAndBad, { version: 2, hiddenColumns: [1] }, null];

      states.forEach((state) => {
        const validation = vs(hot).validateViewState(state);
        const result = vs(hot).setViewState(state);

        expect(validation.skipped).toEqual(result.skipped);
        expect(validation.applicable).toEqual(result.applied);
        expect(validation.error).toEqual(result.error);
      });
    });

    it('reports a valid state as valid', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(vs(hot).validateViewState({ version: 1, hiddenColumns: [1] })).toEqual({
        valid: true,
        applicable: ['hiddenColumns'],
        skipped: [],
      });
    });
  });

  describe('actionable errors', () => {
    /**
     * Returns the one skipped entry a state produces.
     * @param hot
     * @param state
     */
    function onlyIssue(hot, state) {
      const { skipped } = vs(hot).validateViewState({ version: 1, ...state });

      expect(skipped).toHaveLength(1);

      return skipped[0];
    }

    it('points at the argument of the condition that cannot take it', () => {
      const hot = createGrid(ALL_PLUGINS);
      const conditions = [{ name: 'eq', args: ['a'] }, { name: 'by_value', args: [5] }];

      expect(onlyIssue(hot, {
        filters: [
          { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['a'] }] },
          { column: 1, operation: 'conjunction', conditions },
        ],
      })).toEqual({
        part: 'filters',
        reason: 'invalid',
        path: 'filters[1].conditions[1].args',
        message: 'filters[1].conditions[1].args by_value cannot take these arguments, check their number and type',
      });
    });

    it('names the operation, the condition, and the column of a filter entry', () => {
      const hot = createGrid(ALL_PLUGINS);
      const entry = { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['a'] }] };

      expect(onlyIssue(hot, { filters: [{ ...entry, operation: 'and' }] }).path).toBe('filters[0].operation');
      expect(onlyIssue(hot, { filters: [{ ...entry, conditions: [{ name: 'nope', args: [] }] }] }).path)
        .toBe('filters[0].conditions[0].name');
      expect(onlyIssue(hot, { filters: [{ ...entry, column: 9 }] }).path).toBe('filters[0].column');
      expect(onlyIssue(hot, { filters: [entry, { ...entry, operation: 'disjunction' }] }).path)
        .toBe('filters[1].operation');
      expect(onlyIssue(hot, { filters: [{ ...entry, conditions: [{ name: 'eq', args: 'a' }] }] }).message)
        .toBe('filters[0].conditions[0].args eq expects an array of arguments');
    });

    it('says what is wrong with an order, a sort, a size, and an index', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(onlyIssue(hot, { rowOrder: [0, 0, 1, 2, 3, 4] })).toEqual({
        part: 'rowOrder',
        reason: 'invalid',
        path: 'rowOrder',
        message: 'rowOrder must name each of the 6 rows (0 to 5) exactly once',
      });
      expect(onlyIssue(hot, { columnOrder: [1, 0] })).toEqual({
        part: 'columnOrder',
        reason: 'sizeMismatch',
        path: 'columnOrder',
        message: 'columnOrder lists 2 columns, and the grid has 4',
      });
      expect(onlyIssue(hot, { sort: { columns: [{ column: 1.5, sortOrder: 'asc' }] } })).toEqual({
        part: 'sort',
        reason: 'invalid',
        path: 'sort.columns[0].column',
        message: 'sort.columns[0].column must be a physical column index or a column property',
      });
      expect(onlyIssue(hot, { sort: { columns: [{ column: 0, sortOrder: 'up' }] } }).path)
        .toBe('sort.columns[0].sortOrder');
      expect(onlyIssue(hot, { columnWidths: [[0, 50], [1, 0]] })).toEqual({
        part: 'columnWidths',
        reason: 'invalid',
        path: 'columnWidths[1]',
        message: 'columnWidths[1] must be [index, size] with a non-negative index and a positive size',
      });
      expect(onlyIssue(hot, { hiddenRows: [1, -2] }).path).toBe('hiddenRows[1]');
      expect(onlyIssue(hot, { frozen: { rowsTop: 1, rowsBottom: 0, columnsStart: -1, columnsEnd: 0 } }).path)
        .toBe('frozen.columnsStart');
      expect(onlyIssue(createGrid({ pagination: true }), { pagination: { page: 1, pageSize: 'all' } }).path)
        .toBe('pagination.pageSize');
    });

    it('explains a disabled plugin, a server-owned part, a conflict, and a selection outside the grid', () => {
      const plain = createGrid();
      const paginated = createGrid({ pagination: true });
      const server = createGrid(ALL_PLUGINS);

      server.addHook('hasExternalDataSource', () => true);

      expect(onlyIssue(plain, { hiddenColumns: [1] })).toEqual({
        part: 'hiddenColumns',
        reason: 'pluginDisabled',
        path: 'hiddenColumns',
        message: 'hiddenColumns needs the hiddenColumns plugin enabled on this grid',
      });
      expect(onlyIssue(server, { filters: [] }).reason).toBe('externalDataSource');
      expect(onlyIssue(paginated, { frozen: { rowsTop: 2, rowsBottom: 0, columnsStart: 0, columnsEnd: 0 } })).toEqual({
        part: 'frozen',
        reason: 'pluginConflict',
        path: 'frozen',
        message: 'frozen rows cannot run on a grid with Pagination; send rowsTop and rowsBottom as 0, ' +
          'or turn Pagination off',
      });
      expect(onlyIssue(plain, {
        selection: {
          ranges: [{ from: [10, 0], to: [10, 0], highlight: [10, 0] }],
          activeLayer: 0,
          selectedByRowHeader: [],
          selectedByColumnHeader: [],
          rowExtentSpansGrid: [],
          columnExtentSpansGrid: [],
          disableHeadersHighlight: false,
        },
      })).toEqual({
        part: 'selection',
        reason: 'outOfRange',
        path: 'selection',
        message: 'the selection lies outside the grid (6 rows, 4 columns)',
      });
    });

    it('reports a selection outside the grid before atomic applies anything', () => {
      const hot = createGrid(ALL_PLUGINS);
      const selection = {
        ranges: [{ from: [10, 0], to: [10, 0], highlight: [10, 0] }],
        activeLayer: 0,
        selectedByRowHeader: [],
        selectedByColumnHeader: [],
        rowExtentSpansGrid: [],
        columnExtentSpansGrid: [],
        disableHeadersHighlight: false,
      };

      expect(vs(hot).setViewState({ version: 1, hiddenColumns: [1], selection }, { atomic: true }).applied).toEqual([]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
    });
  });

  describe('a state that is not an object', () => {
    it('returns an error and applies nothing for null, undefined, and other values', () => {
      jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});

      const hot = createGrid(ALL_PLUGINS);

      [null, undefined, 'x', 3, []].forEach((state) => {
        const result = vs(hot).setViewState(state);

        expect(result.applied).toEqual([]);
        expect(result.error.reason).toBe('notAnObject');
        expect(result.error.message).toMatch(/expected a view state object/);
        expect(vs(hot).validateViewState(state).valid).toBe(false);
      });
    });

    it('returns an error for another version, with the parts listed as skipped', () => {
      jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});

      const hot = createGrid(ALL_PLUGINS);
      const result = vs(hot).setViewState({ version: 2, hiddenColumns: [1] });

      expect(result.error.reason).toBe('unsupportedVersion');
      expect(brief(result.skipped)).toEqual([{ part: 'hiddenColumns', reason: 'unsupportedVersion' }]);
    });
  });

  describe('filter arguments are checked before the grid changes', () => {
    it.each([
      ['by_value', [5]],
      ['by_value', 'a'],
      ['eq', 'a'],
    ])('keeps the filters, the order and the rows for %s with %j', (name, args) => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      const before = { conditions: filters.exportConditions(), data: hot.getData() };
      const result = vs(hot).setViewState(
        { version: 1, filters: [{ column: 0, operation: 'conjunction', conditions: [{ name, args }] }] },
        { atomic: true },
      );

      expect(result.applied).toEqual([]);
      expect({ conditions: filters.exportConditions(), data: hot.getData() }).toEqual(before);
    });

    it('does not throw, and does not touch the filter collection', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');
      const importConditions = jest.spyOn(filters, 'importConditions');

      expect(() => vs(hot).setViewState({
        version: 1,
        filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'by_value', args: [5] }] }],
      })).not.toThrow();
      expect(importConditions).not.toHaveBeenCalled();
    });
  });

  describe('keys and indexes the grid cannot honor', () => {
    it('reports a key that is not a part, so a misspelled part is not valid', () => {
      const hot = createGrid(ALL_PLUGINS);
      const result = vs(hot).validateViewState({ version: 1, hiddenColumn: [1], hiddenRows: [1] });

      expect(result.valid).toBe(false);
      expect(result.applicable).toEqual(['hiddenRows']);
      expect(result.skipped).toEqual([{
        part: 'hiddenColumn',
        reason: 'invalid',
        path: 'hiddenColumn',
        message: expect.stringMatching(/^hiddenColumn is not a part of the view state, the parts are: columnOrder,/),
      }]);
      expect(vs(hot).setViewState({ version: 1, sorting: {} }, { atomic: true }).error.reason)
        .toBe('atomicRejected');
    });

    it.each([
      ['hiddenRows', [999], 'hiddenRows[0]'],
      ['hiddenColumns', [0, 4], 'hiddenColumns[1]'],
      ['trimmedRows', [6], 'trimmedRows[0]'],
      ['columnWidths', [[4, 80]], 'columnWidths[0]'],
      ['rowHeights', [[6, 40]], 'rowHeights[0]'],
      ['scroll', { row: 500, col: 0 }, 'scroll.row'],
      ['scroll', { row: 0, col: 4 }, 'scroll.col'],
    ])('reports %s %j as out of range instead of dropping it', (part, value, path) => {
      const hot = createGrid(ALL_PLUGINS);
      const before = vs(hot).getViewState();
      const { skipped, applied } = vs(hot).setViewState({ version: 1, [part]: value });

      expect(skipped.map(issue => ({ part: issue.part, reason: issue.reason, path: issue.path })))
        .toEqual([{ part, reason: 'outOfRange', path }]);
      expect(applied).toEqual([]);
      expect(vs(hot).getViewState()).toEqual(before);
    });

    it('accepts the last index of each axis', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(vs(hot).setViewState({
        version: 1,
        hiddenRows: [5],
        hiddenColumns: [3],
        columnWidths: [[3, 80]],
        scroll: { row: 5, col: 3 },
      }).skipped).toEqual([]);
    });

    it('imports the same filter operation named twice for one column', () => {
      const hot = createGrid(ALL_PLUGINS);
      const state = {
        version: 1,
        filters: [
          { column: 0, operation: 'conjunction', conditions: [{ name: 'neq', args: ['0-0'] }] },
          { column: 0, operation: 'conjunction', conditions: [{ name: 'neq', args: ['1-0'] }] },
        ],
      };

      expect(vs(hot).validateViewState(state).valid).toBe(true);
      expect(vs(hot).setViewState(state).applied).toEqual(['filters']);
      expect(hot.countRows()).toBe(4);
    });

    it('does not scan merged cells or borders when it reads the view', () => {
      const hot = createGrid(ALL_PLUGINS);
      const getVisibleMergedAreas = jest.fn(() => []);

      hot.getPlugin = new Proxy(hot.getPlugin, {
        apply: (target, thisArg, args) => (args[0] === 'mergeCells' ?
          { enabled: true, getVisibleMergedAreas } : Reflect.apply(target, thisArg, args)),
      });

      vs(hot).getViewState();

      expect(getVisibleMergedAreas).not.toHaveBeenCalled();
    });
  });

  describe('undo: record, part by part', () => {
    const tree = () => [
      { name: 'A', __children: [{ name: 'A1' }, { name: 'A2' }] },
      { name: 'B', __children: [{ name: 'B1' }, { name: 'B2' }] },
    ];

    /**
     * Reads the view the parts describe, without the selection and the scroll position, which no step holds.
     * @param hot
     */
    function readView(hot) {
      const { selection, scroll, ...view } = vs(hot).getViewState();

      return { ...view, rows: hot.getData() };
    }

    it.each([
      ['rowOrder', { settings: ALL_PLUGINS, state: { rowOrder: [5, 4, 3, 2, 1, 0] } }],
      ['rowOrder under a sort', {
        settings: ALL_PLUGINS,
        before: hot => hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' }),
        state: { rowOrder: [1, 0, 2, 3, 4, 5] },
      }],
      ['trimmedRows', { settings: ALL_PLUGINS, state: { trimmedRows: [0, 5] } }],
      ['hiddenRows', { settings: ALL_PLUGINS, state: { hiddenRows: [1, 4] } }],
      ['hiddenRows over a trimmed hidden row', {
        settings: ALL_PLUGINS,
        before: (hot) => {
          hot.getPlugin('hiddenRows').hideRows([1, 4]);
          hot.getPlugin('filters').addCondition(0, 'neq', ['4-0']);
          hot.getPlugin('filters').filter();
        },
        state: { hiddenRows: [2] },
      }],
      ['rowHeights', { settings: ALL_PLUGINS, state: { rowHeights: [[1, 70]] } }],
      ['pagination', { settings: { pagination: { pageSize: 2 } }, state: { pagination: { page: 3, pageSize: 2 } } }],
      ['collapsedRows', {
        settings: { data: tree(), nestedRows: true, rowHeaders: true },
        state: { collapsedRows: [[1]] },
      }],
    ])('reverts and reapplies %s with one undo and one redo', (_, { settings, before, state }) => {
      const hot = createGrid({ ...settings, undo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      before?.(hot);
      undoRedo.clear();

      const original = readView(hot);

      expect(vs(hot).setViewState({ version: 1, ...state }, { undo: 'record' }).skipped).toEqual([]);

      const restored = readView(hot);

      expect(restored).not.toEqual(original);
      expect(undoRedo.isUndoAvailable()).toBe(true);

      undoRedo.undo();
      expect(readView(hot)).toEqual(original);
      expect(undoRedo.isUndoAvailable()).toBe(false);

      undoRedo.redo();
      expect(readView(hot)).toEqual(restored);
    });

    it('does not record a restore while UndoRedo is off', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undo: false });

      expect(vs(hot).setViewState({ version: 1, hiddenColumns: [1] }, { undo: 'record' }).applied)
        .toEqual(['hiddenColumns']);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });
  });

  describe('previous after a row order that clears the sort', () => {
    it('brings back the rows and the sort', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const sortedRows = hot.getData();
      const { previous } = vs(hot).setViewState({ version: 1, rowOrder: [0, 1, 2, 3, 4, 5] });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      expect(previous.sort).toEqual({ columns: [{ column: 1, sortOrder: 'desc' }] });

      expect(vs(hot).setViewState(previous).skipped).toEqual([]);
      expect(hot.getData()).toEqual(sortedRows);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    });

    it('does not add the sort to previous for a state that carries it', () => {
      const hot = createGrid(ALL_PLUGINS);
      const { previous } = vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        rowOrder: [5, 4, 3, 2, 1, 0],
      });

      expect(Object.keys(previous).sort()).toEqual(['rowOrder', 'sort', 'version']);
    });
  });

  describe('the second review round', () => {
    it('does not clear a sort that is not on, so a later sort and clear return to the restored order', () => {
      const hot = createGrid(ALL_PLUGINS);
      const sorting = hot.getPlugin('columnSorting');
      const sort = jest.spyOn(sorting, 'sort');

      vs(hot).setViewState({ version: 1, rowOrder: [5, 4, 3, 2, 1, 0] });

      expect(sort).not.toHaveBeenCalled();

      sorting.sort({ column: 0, sortOrder: 'asc' });
      sorting.clearSort();

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([5, 4, 3, 2, 1, 0]);
    });

    it('still clears a sort that is on, and leaves previous without a sort when none was', () => {
      const sorted = createGrid(ALL_PLUGINS);
      const plain = createGrid(ALL_PLUGINS);

      sorted.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      expect(vs(sorted).setViewState({ version: 1, rowOrder: [0, 1, 2, 3, 4, 5] }).previous.sort).toBeDefined();
      expect(sorted.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      expect(vs(plain).setViewState({ version: 1, rowOrder: [1, 0, 2, 3, 4, 5] }).previous.sort).toBeUndefined();
    });

    it('measures a selection and a scroll against the rows the same state leaves', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');
      const selection = {
        ranges: [{ from: [5, 0], to: [5, 0], highlight: [5, 0] }],
        activeLayer: 0,
        selectedByRowHeader: [],
        selectedByColumnHeader: [],
        rowExtentSpansGrid: [],
        columnExtentSpansGrid: [],
        disableHeadersHighlight: false,
      };

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      expect(hot.countRows()).toBe(1);
      expect(vs(hot).validateViewState({ version: 1, selection }).skipped[0].reason).toBe('outOfRange');

      const state = { version: 1, filters: [], selection, scroll: { row: 5, col: 0 } };

      expect(vs(hot).validateViewState(state).valid).toBe(true);

      const result = vs(hot).setViewState(state, { atomic: true });

      expect(result.error).toBeUndefined();
      expect(result.applied).toEqual(['filters', 'selection', 'scroll']);
      expect(hot.getSelected()).toEqual([[5, 0, 5, 0]]);
    });

    it('reports a selection and a scroll that still miss the rows the state leaves', () => {
      const hot = createGrid(ALL_PLUGINS);
      const selection = {
        ranges: [{ from: [10, 0], to: [10, 0], highlight: [10, 0] }],
        activeLayer: 0,
        selectedByRowHeader: [],
        selectedByColumnHeader: [],
        rowExtentSpansGrid: [],
        columnExtentSpansGrid: [],
        disableHeadersHighlight: false,
      };
      const result = vs(hot).setViewState({ version: 1, trimmedRows: [0], selection, scroll: { row: 10, col: 0 } });

      expect(result.applied).toEqual(['trimmedRows']);
      expect(result.skipped.map(issue => [issue.part, issue.reason]).sort())
        .toEqual([['scroll', 'outOfRange'], ['selection', 'outOfRange']]);
    });

    it('tells the hiding listeners a row changed when one hidden row replaces another', () => {
      const hot = createGrid(ALL_PLUGINS);
      const flags = [];

      hot.addHook('afterHideRows', (...args) => flags.push(['hide', args[2], args[3]]));
      hot.addHook('afterUnhideRows', (...args) => flags.push(['unhide', args[2], args[3]]));
      vs(hot).setViewState({ version: 1, hiddenRows: [1] });
      flags.length = 0;
      vs(hot).setViewState({ version: 1, hiddenRows: [2] });

      expect(flags).toEqual([['unhide', true, true], ['hide', true, true]]);
    });

    it('tells them a row changed when it unhides a row a filter trims', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');
      const stateChanged = [];

      hot.getPlugin('hiddenRows').hideRows([1]);
      filters.addCondition(0, 'neq', ['1-0']);
      filters.filter();
      hot.addHook('afterUnhideRows', (...args) => stateChanged.push(args[3]));
      vs(hot).setViewState({ version: 1, hiddenRows: [] });

      expect(stateChanged).toEqual([true]);
    });

    it.each(['rowOrder', 'hiddenRows', 'trimmedRows', 'rowHeights', 'selection'])(
      'skips %s on a grid that loads its rows through a server, and leaves it out of the view',
      (part) => {
        const hot = createGrid(ALL_PLUGINS);

        hot.addHook('hasExternalDataSource', () => true);

        const values = {
          rowOrder: [5, 4, 3, 2, 1, 0],
          hiddenRows: [1],
          trimmedRows: [1],
          rowHeights: [[1, 60]],
          selection: null,
        };
        const result = vs(hot).setViewState({ version: 1, [part]: values[part], hiddenColumns: [1] });

        expect(result.skipped.map(issue => [issue.part, issue.reason])).toEqual([[part, 'externalDataSource']]);
        expect(result.applied).toEqual(['hiddenColumns']);
        expect(Object.keys(vs(hot).getViewState())).not.toContain(part);
      },
    );

    it('keeps the parts that do not depend on the loaded page on a server grid', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.addHook('hasExternalDataSource', () => true);

      expect(Object.keys(vs(hot).getViewState())).toEqual(
        expect.arrayContaining(['columnOrder', 'hiddenColumns', 'columnWidths', 'frozen']),
      );
    });

    it('does not copy a row or column sequence for a request that asks for neither', () => {
      const hot = createGrid(ALL_PLUGINS);
      const rows = jest.spyOn(hot.rowIndexMapper, 'getIndexesSequence');
      const columns = jest.spyOn(hot.columnIndexMapper, 'getIndexesSequence');

      vs(hot).setViewState({ version: 1, scroll: { row: 0, col: 0 } });

      expect(rows).not.toHaveBeenCalled();
      expect(columns).not.toHaveBeenCalled();

      vs(hot).setViewState({ version: 1, hiddenColumns: [1] });

      // Hiding a column reads the column order to translate its index, and never the row order.
      expect(rows).not.toHaveBeenCalled();
    });
  });

  describe('one index space for the columns', () => {
    /**
     * Creates a grid whose columns each sort the rows into a different order, so a sort on the wrong
     * column shows in the data.
     * @param settings
     */
    function createShuffledGrid(settings = {}) {
      return createGrid({
        ...ALL_PLUGINS,
        data: [
          [3, 'b', 'z', 40],
          [1, 'd', 'x', 10],
          [4, 'a', 'w', 30],
          [2, 'c', 'y', 20],
        ],
        ...settings,
      });
    }

    /**
     * Returns the values of a physical column, in the order the grid shows the rows.
     * @param hot
     * @param physicalColumn
     */
    function columnValues(hot, physicalColumn) {
      return hot.getDataAtCol(hot.toVisualColumn(physicalColumn));
    }

    /**
     * Clears the sort and sorts again by the reported config, and returns whether the rows stayed put:
     * the config then names the column the rows are sorted by.
     * @param hot
     */
    function sortConfigDrivesRows(hot) {
      const sorting = hot.getPlugin('columnSorting');
      const config = sorting.getSortConfig();
      const before = hot.getData();

      sorting.clearSort();
      sorting.sort(config);

      return JSON.stringify(hot.getData()) === JSON.stringify(before);
    }

    it('sorts and hides the same physical column after the columns were moved', () => {
      const hot = createShuffledGrid();

      hot.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);

      const { skipped } = vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 1, sortOrder: 'desc' }] },
        hiddenColumns: [1],
      });

      expect(skipped).toEqual([]);
      // Physical column 1 is shown at visual index 2.
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'desc' }]);
      expect(columnValues(hot, 1)).toEqual(['d', 'c', 'b', 'a']);
    });

    it('sorts against the column order the same state restores', () => {
      const hot = createShuffledGrid();

      hot.columnIndexMapper.setIndexesSequence([1, 0, 3, 2]);
      vs(hot).setViewState({
        version: 1,
        columnOrder: [3, 2, 1, 0],
        sort: { columns: [{ column: 1, sortOrder: 'asc' }] },
      });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      expect(columnValues(hot, 1)).toEqual(['a', 'b', 'c', 'd']);
      expect(sortConfigDrivesRows(hot)).toBe(true);
    });

    it('reports the sort by its physical column', () => {
      const hot = createShuffledGrid();

      hot.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(vs(hot).getViewState().sort).toEqual({ columns: [{ column: 3, sortOrder: 'asc' }] });
    });

    it('reports the sort it replaced by its physical column, and reverts to it', () => {
      const hot = createShuffledGrid();

      hot.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      const sorted = hot.getData();
      const { previous } = vs(hot).setViewState({ version: 1, sort: { columns: [] } });

      expect(previous.sort).toEqual({ columns: [{ column: 3, sortOrder: 'asc' }] });

      vs(hot).setViewState(previous);

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
      expect(hot.getData()).toEqual(sorted);
    });

    it('restores the same view through JSON after the columns were moved', () => {
      const source = createShuffledGrid();

      source.columnIndexMapper.setIndexesSequence([2, 0, 3, 1]);
      source.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' }); // physical 2
      source.getPlugin('hiddenColumns').hideColumn(1); // physical 0
      source.getPlugin('manualColumnResize').setManualSize(2, 120); // physical 3

      const filters = source.getPlugin('filters');

      filters.addCondition(3, 'neq', ['d']); // physical 1
      filters.filter();

      const state = throughJson(vs(source).getViewState());

      expect(state.sort).toEqual({ columns: [{ column: 2, sortOrder: 'desc' }] });
      expect(state.hiddenColumns).toEqual([0]);
      expect(state.columnWidths).toEqual([[3, 120]]);
      expect(state.filters[0].column).toBe(1);

      const whole = createShuffledGrid();

      expect(vs(whole).setViewState(state).skipped).toEqual([]);
      expect(vs(whole).getViewState()).toEqual(vs(source).getViewState());
      expect(whole.getData()).toEqual(source.getData());
      expect(sortConfigDrivesRows(whole)).toBe(true);

      // Without the orders, a grid that shows its columns elsewhere sorts, filters, hides and sizes
      // the same physical columns, so each one shows the same values in the same row order.
      const { columnOrder, rowOrder, ...parts } = state;
      const reordered = createShuffledGrid();

      reordered.columnIndexMapper.setIndexesSequence([1, 3, 0, 2]);

      expect(vs(reordered).setViewState(parts).skipped).toEqual([]);
      [0, 1, 2, 3].forEach((column) => {
        expect(columnValues(reordered, column)).toEqual(columnValues(source, column));
      });
      expect(vs(reordered).getViewState()).toEqual({ ...vs(source).getViewState(), columnOrder: [1, 3, 0, 2] });
    });

    it('reports a sort column past the last physical column as out of range', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(vs(hot).validateViewState({ version: 1, sort: { columns: [{ column: 4, sortOrder: 'asc' }] } })
        .skipped).toEqual([{
        part: 'sort',
        reason: 'outOfRange',
        path: 'sort.columns[0].column',
        message: 'sort.columns[0].column is 4, and the grid has 4 columns',
      }]);
    });

    it.each([
      ['maxCols hides', { maxCols: 2 }, null],
      ['a trimming map removes', {}, (hot) => {
        hot.columnIndexMapper.createAndRegisterIndexMap('test', 'trimming', false).setValueAtIndex(3, true);
      }],
    ])('reports a sort column %s as out of range, before the sort is cleared', (_, settings, setup) => {
      const hot = createShuffledGrid(settings);

      setup?.(hot);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      const sorted = hot.getData();
      const issue = {
        part: 'sort',
        reason: 'outOfRange',
        path: 'sort.columns[0].column',
        message: 'sort.columns[0].column is 3, a column the grid does not show',
      };

      const state = { version: 1, sort: { columns: [{ column: 3, sortOrder: 'asc' }] } };

      expect(vs(hot).validateViewState(state).skipped).toEqual([issue]);
      expect(vs(hot).setViewState(state, { atomic: true }).error.reason).toBe('atomicRejected');
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(hot.getData()).toEqual(sorted);
    });

    it('keeps a vetoed sort on its column when the same state restores another column order', () => {
      const source = createShuffledGrid();

      source.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      source.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' }); // physical 1

      const state = throughJson(vs(source).getViewState());
      const hot = createShuffledGrid();
      const sorting = hot.getPlugin('columnSorting');
      const veto = () => false;

      // The plugin writes the states back only once it holds its pre-sort cache, built on a first sort.
      sorting.sort({ column: 0, sortOrder: 'asc' });
      sorting.clearSort();
      hot.columnIndexMapper.setIndexesSequence([1, 0, 3, 2]);
      hot.addHook('beforeColumnSort', veto);
      vs(hot).setViewState(state);
      hot.removeHook('beforeColumnSort', veto);

      expect(sorting.getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      expect(columnValues(hot, 1)).toEqual(['a', 'b', 'c', 'd']);
      expect(sortConfigDrivesRows(hot)).toBe(true);
    });
  });

  describe('columns named by their property', () => {
    /**
     * Creates a grid over objects, with the columns bound to their properties.
     * @param settings
     */
    function createBoundGrid(settings = {}) {
      return createGrid({
        ...ALL_PLUGINS,
        data: [
          { id: 3, name: 'c', address: { city: 'Z' } },
          { id: 1, name: 'a', address: { city: 'Y' } },
          { id: 2, name: 'b', address: { city: 'X' } },
        ],
        columns: [{ data: 'id' }, { data: 'name' }, { data: 'address.city' }],
        ...settings,
      });
    }

    it('sorts by a property', () => {
      const hot = createBoundGrid();

      expect(vs(hot).setViewState({ version: 1, sort: { columns: [{ column: 'name', sortOrder: 'desc' }] } })
        .skipped).toEqual([]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
      expect(hot.getDataAtCol(1)).toEqual(['c', 'b', 'a']);
    });

    it('sorts by a nested property', () => {
      const hot = createBoundGrid();

      vs(hot).setViewState({ version: 1, sort: { columns: [{ column: 'address.city', sortOrder: 'asc' }] } });

      expect(hot.getDataAtCol(2)).toEqual(['X', 'Y', 'Z']);
      expect(vs(hot).getViewState().sort).toEqual({ columns: [{ column: 2, sortOrder: 'asc' }] });
    });

    it('resolves a property to its physical column after the columns were moved', () => {
      const hot = createBoundGrid();

      hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
      vs(hot).setViewState({
        version: 1,
        sort: { columns: [{ column: 'name', sortOrder: 'asc' }] },
        hiddenColumns: ['id'],
      });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
      expect(vs(hot).getViewState().hiddenColumns).toEqual([0]);
    });

    it('hides, resizes, and filters a column named by its property', () => {
      const hot = createBoundGrid();
      const { skipped } = vs(hot).setViewState({
        version: 1,
        hiddenColumns: ['id'],
        columnWidths: [['address.city', 140]],
        filters: [{ column: 'name', operation: 'conjunction', conditions: [{ name: 'eq', args: ['b'] }] }],
      });

      expect(skipped).toEqual([]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0]);
      expect(hot.getColWidth(2)).toBe(140);
      expect(hot.getData()).toEqual([[2, 'b', 'X']]);
      expect(vs(hot).getViewState().filters[0].column).toBe(1);
    });

    it.each([
      ['sort', { columns: [{ column: 'amount', sortOrder: 'asc' }] }, 'sort.columns[0].column'],
      ['hiddenColumns', ['id', 'amount'], 'hiddenColumns[1]'],
      ['columnWidths', [['amount', 50]], 'columnWidths[0]'],
      ['filters', [{ column: 'amount', operation: 'conjunction', conditions: [] }], 'filters[0].column'],
    ])('reports an unknown property in %s as invalid, with its path', (part, value, path) => {
      const hot = createBoundGrid();
      const before = vs(hot).getViewState();
      const { skipped } = vs(hot).setViewState({ version: 1, [part]: value });

      expect(skipped).toEqual([{
        part,
        reason: 'invalid',
        path,
        message: `${path} is 'amount', and no column of this grid has that property`,
      }]);
      expect(vs(hot).getViewState()).toEqual(before);
    });

    it('applies nothing for an unknown property when atomic is on', () => {
      const hot = createBoundGrid();
      const result = vs(hot).setViewState({
        version: 1,
        hiddenColumns: ['id'],
        sort: { columns: [{ column: 'amount', sortOrder: 'asc' }] },
      }, { atomic: true });

      expect(result.error.reason).toBe('atomicRejected');
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
    });

    it('treats a property and an index that name one column as one sort column named twice', () => {
      const hot = createBoundGrid({ columnSorting: false, multiColumnSorting: true });

      expect(vs(hot).validateViewState({
        version: 1,
        sort: { columns: [{ column: 'name', sortOrder: 'asc' }, { column: 1, sortOrder: 'desc' }] },
      }).skipped).toEqual([{
        part: 'sort',
        reason: 'invalid',
        path: 'sort.columns[1].column',
        message: 'sort.columns[1].column names the same column as sort.columns[0].column',
      }]);
    });

    it('names the last of two columns that share a property', () => {
      const hot = createBoundGrid({ columns: [{ data: 'id' }, { data: 'name' }, { data: 'name' }] });

      vs(hot).setViewState({ version: 1, hiddenColumns: ['name'] });

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
    });

    it('reads the properties of a columns function', () => {
      const props = ['id', 'name', 'address.city'];
      const hot = createBoundGrid({ columns: column => (column < props.length ? { data: props[column] } : null) });

      vs(hot).setViewState({ version: 1, sort: { columns: [{ column: 'address.city', sortOrder: 'asc' }] } });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      expect(hot.getDataAtCol(2)).toEqual(['X', 'Y', 'Z']);
    });

    it('reports a property of a column the grid does not show as out of range', () => {
      const hot = createBoundGrid();

      hot.columnIndexMapper.createAndRegisterIndexMap('test', 'trimming', false).setValueAtIndex(1, true);

      expect(vs(hot).validateViewState({ version: 1, hiddenColumns: ['name'] }).skipped).toEqual([{
        part: 'hiddenColumns',
        reason: 'outOfRange',
        path: 'hiddenColumns[0]',
        message: 'hiddenColumns[0] is \'name\', a column the grid does not show',
      }]);
    });

    it('gives a column the grid does not show the same answer by index and by property', () => {
      const hot = createBoundGrid();

      hot.columnIndexMapper.createAndRegisterIndexMap('test', 'trimming', false).setValueAtIndex(1, true);

      const reasons = state => brief(vs(hot).validateViewState({ version: 1, ...state }).skipped);
      const condition = [{ name: 'eq', args: ['b'] }];

      [['name'], [1]].forEach(([column]) => {
        expect(reasons({ hiddenColumns: [column] })).toEqual([{ part: 'hiddenColumns', reason: 'outOfRange' }]);
        expect(reasons({ columnWidths: [[column, 90]] })).toEqual([{ part: 'columnWidths', reason: 'outOfRange' }]);
        expect(reasons({ filters: [{ column, operation: 'conjunction', conditions: condition }] }))
          .toEqual([{ part: 'filters', reason: 'outOfRange' }]);
        expect(reasons({ sort: { columns: [{ column, sortOrder: 'asc' }] } }))
          .toEqual([{ part: 'sort', reason: 'outOfRange' }]);
      });
    });

    it('reports a column past maxCols as out of range, by index and by property', () => {
      const hot = createBoundGrid({ maxCols: 2 });
      const { skipped } = vs(hot).validateViewState({
        version: 1,
        hiddenColumns: [2],
        columnWidths: [['address.city', 90]],
      });

      expect(skipped).toEqual([
        {
          part: 'hiddenColumns',
          reason: 'outOfRange',
          path: 'hiddenColumns[0]',
          message: 'hiddenColumns[0] is 2, a column the grid does not show',
        },
        {
          part: 'columnWidths',
          reason: 'outOfRange',
          path: 'columnWidths[0]',
          message: 'columnWidths[0] is \'address.city\', a column the grid does not show',
        },
      ]);
    });

    it.each([
      ['columnWidths', [['address.city', 120], [2, 90]], 'columnWidths[1]', 'columnWidths[0]'],
      ['sort', { columns: [{ column: 'name', sortOrder: 'asc' }, { column: 'name', sortOrder: 'desc' }] },
        'sort.columns[1].column', 'sort.columns[0].column'],
    ])('reports one column named twice in %s as invalid, by the paths the caller wrote', (part, value, path, first) => {
      const hot = createBoundGrid({ columnSorting: false, multiColumnSorting: true });

      expect(vs(hot).validateViewState({ version: 1, [part]: value }).skipped).toEqual([{
        part,
        reason: 'invalid',
        path,
        message: `${path} names the same column as ${first}`,
      }]);
    });

    it('reads a numeric string as a property, not as an index', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(vs(hot).validateViewState({ version: 1, hiddenColumns: ['2'] }).skipped).toEqual([{
        part: 'hiddenColumns',
        reason: 'invalid',
        path: 'hiddenColumns[0]',
        message: 'hiddenColumns[0] is \'2\', and no column of this grid has that property',
      }]);
    });

    it('reads the properties of objects without a columns option', () => {
      const hot = createBoundGrid({ columns: undefined });

      vs(hot).setViewState({ version: 1, hiddenColumns: ['name'] });

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
    });

    it('takes no property on a grid over arrays, and none for a row', () => {
      const hot = createGrid(ALL_PLUGINS);

      expect(brief(vs(hot).validateViewState({
        version: 1,
        hiddenColumns: ['0'],
        hiddenRows: ['name'],
        rowHeights: [['name', 40]],
      }).skipped)).toEqual([
        { part: 'hiddenRows', reason: 'invalid' },
        { part: 'hiddenColumns', reason: 'invalid' },
        { part: 'rowHeights', reason: 'invalid' },
      ]);
    });
  });
});
