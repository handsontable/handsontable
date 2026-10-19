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
 * Sends a view state through JSON, the way an application stores it.
 * @param state
 */
function throughJson(state) {
  return JSON.parse(JSON.stringify(state));
}

describe('Core#getViewState and Core#setViewState', () => {
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
    registerPlugin(NestedRows);
    registerPlugin(MultiColumnSorting);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerCellType(CheckboxCellType);
  });

  afterEach(() => {
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

  describe('getViewState()', () => {
    it('returns plain data that survives JSON unchanged', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.getPlugin('hiddenColumns').hideColumn(2);
      hot.selectCell(1, 1, 2, 3);

      const state = hot.getViewState();

      expect(state.version).toBe(1);
      expect(throughJson(state)).toEqual(state);
    });

    it('leaves out the parts whose plugin is disabled', () => {
      const hot = createGrid();
      const state = hot.getViewState();

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

      const state = hot.getViewState();

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

      const result = target.setViewState(throughJson(source.getViewState()));

      expect(result.skipped).toEqual([]);
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

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getPlugin('filters').exportConditions()).toEqual(filters.exportConditions());
      expect(target.getData()).toEqual([['2-0', '2-1', '2-2', '2-3']]);
    });

    it('restores the hidden rows and columns by their physical indexes', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('hiddenRows').hideRows([1, 3]);
      source.getPlugin('hiddenColumns').hideColumns([0, 2]);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getPlugin('hiddenRows').getHiddenRows()).toEqual([1, 3]);
      expect(target.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0, 2]);
    });

    it('restores the trimmed rows', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('trimRows').trimRows([0, 5]);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getPlugin('trimRows').getTrimmedRows()).toEqual([0, 5]);
      expect(target.countRows()).toBe(4);
    });

    it('restores the row and column order', () => {
      const source = createGrid();
      const target = createGrid();

      source.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
      source.rowIndexMapper.setIndexesSequence([5, 4, 3, 2, 1, 0]);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.columnIndexMapper.getIndexesSequence()).toEqual([3, 2, 1, 0]);
      expect(target.rowIndexMapper.getIndexesSequence()).toEqual([5, 4, 3, 2, 1, 0]);
      expect(target.getDataAtCell(0, 0)).toBe('5-3');
    });

    it('restores the manual column widths and row heights', () => {
      const source = createGrid(ALL_PLUGINS);
      const target = createGrid(ALL_PLUGINS);

      source.getPlugin('manualColumnResize').setManualSize(1, 180);
      source.getPlugin('manualRowResize').setManualSize(2, 64);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getColWidth(1)).toBe(180);
      expect(target.getRowHeight(2)).toBe(64);
    });

    it('restores the frozen rows and columns', () => {
      const source = createGrid({ fixedRowsTop: 1, fixedRowsBottom: 2, fixedColumnsStart: 2, fixedColumnsEnd: 1 });
      const target = createGrid();

      target.setViewState(throughJson(source.getViewState()));

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

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getPlugin('pagination').getCurrentPageSize()).toBe(2);
      expect(target.getPlugin('pagination').getCurrentPage()).toBe(3);
    });

    it('restores a multi-layer cell selection with its focus', () => {
      const source = createGrid();
      const target = createGrid();

      source.selectCells([[0, 0, 1, 1], [3, 2, 4, 3]]);
      source.selection.setRangeFocus(source._createCellCoords(4, 3), 1);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getSelected()).toEqual([[0, 0, 1, 1], [3, 2, 4, 3]]);
      expect(target.getSelectedRangeActive().highlight.toObject()).toEqual({ row: 4, col: 3 });
    });

    it('restores a whole-column selection as one', () => {
      const source = createGrid({ colHeaders: true });
      const target = createGrid({ colHeaders: true });

      source.selectColumns(1, 2);

      target.setViewState(throughJson(source.getViewState()));

      expect(target.getSelected()).toEqual(source.getSelected());
      expect(target.selection.isSelectedByColumnHeader()).toBe(true);
    });

    it('clears the selection for a state captured with nothing selected', () => {
      const source = createGrid();
      const target = createGrid();

      target.selectCell(1, 1);
      target.setViewState(throughJson(source.getViewState()));

      expect(target.getSelected()).toBeUndefined();
    });
  });

  describe('setViewState() with a partial state', () => {
    it('leaves the parts the state does not carry as they are', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('hiddenRows').hideRow(2);
      hot.getPlugin('manualColumnResize').setManualSize(0, 150);
      hot.selectCell(1, 1);

      const result = hot.setViewState({ version: 1, sort: { columns: [{ column: 0, sortOrder: 'desc' }] } });

      expect(result.skipped).toEqual([]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows().map(row => hot.toPhysicalRow(row))).toEqual([2]);
      expect(hot.getColWidth(0)).toBe(150);
      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('sorts from the current order when the state names no pre-sort order', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.setViewState({ version: 1, sort: { columns: [{ column: 0, sortOrder: 'desc' }] } });
      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getDataAtCol(0)).toEqual(['0-0', '1-0', '2-0', '3-0', '4-0', '5-0']);
    });

    it('keeps the row heights when only the column widths are restored', () => {
      const hot = createGrid(ALL_PLUGINS);

      hot.getPlugin('manualRowResize').setManualSize(1, 70);
      hot.setViewState({ version: 1, columnWidths: [[0, 120]] });

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

      const { skipped } = target.setViewState(throughJson(source.getViewState()));

      expect(skipped).toEqual(expect.arrayContaining([
        { part: 'sort', reason: 'pluginDisabled' },
        { part: 'hiddenColumns', reason: 'pluginDisabled' },
        { part: 'filters', reason: 'pluginDisabled' },
      ]));
      // The row order is a part of its own, so the rows still come in the sorted order.
      expect(target.getDataAtCol(0)).toEqual(source.getDataAtCol(0));
    });

    it('skips an order whose length no longer matches the data', () => {
      const hot = createGrid();

      const { skipped } = hot.setViewState({ version: 1, columnOrder: [1, 0], rowOrder: [5, 4, 3, 2, 1, 0] });

      expect(skipped).toEqual([{ part: 'columnOrder', reason: 'sizeMismatch' }]);
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

      const { skipped } = hot.setViewState({ version: 1, selection });

      expect(skipped).toEqual([{ part: 'selection', reason: 'outOfRange' }]);
      expect(hot.getSelected()).toBeUndefined();
    });

    it('skips a part with the wrong shape and applies the rest', () => {
      const hot = createGrid(ALL_PLUGINS);

      const { skipped } = hot.setViewState({
        version: 1,
        hiddenRows: ['1'],
        sort: { columns: [{ column: 0, sortOrder: 'sideways' }] },
        hiddenColumns: [3],
      });

      expect(skipped).toEqual([
        { part: 'sort', reason: 'invalid' },
        { part: 'hiddenRows', reason: 'invalid' },
      ]);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([3]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
    });

    it('applies nothing for an unsupported version, and warns', () => {
      const warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
      const hot = createGrid(ALL_PLUGINS);

      const { skipped } = hot.setViewState({ version: 2, hiddenRows: [1] });

      expect(skipped).toEqual([{ part: 'hiddenRows', reason: 'unsupportedVersion' }]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo', () => {
    it('records no undo step for the restore', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undoRedo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      hot.setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        filters: [{ column: 1, operation: 'conjunction', conditions: [{ name: 'neq', args: ['3-1'] }] }],
      });

      expect(undoRedo.isUndoAvailable()).toBe(false);
      expect(undoRedo.ignoreNewActions).toBe(false);
    });

    it('records no undo step for a restore of every part, including rows written to the hiding map', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undoRedo: true, pagination: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'neq', ['4-0']);
      filters.filter();
      undoRedo.clear();

      const { skipped } = hot.setViewState({
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
        frozen: { rowsTop: 1, rowsBottom: 0, columnsStart: 1, columnsEnd: 0 },
        pagination: { page: 1, pageSize: 3 },
        selection: null,
        scroll: { row: 0, col: 0 },
      });

      expect(skipped).toEqual([]);
      expect(hot.getViewState().hiddenRows).toEqual([1, 4]);
      expect(undoRedo.isUndoAvailable()).toBe(false);
    });

    it('keeps the undo steps recorded before the restore', () => {
      const hot = createGrid({ ...ALL_PLUGINS, undoRedo: true });
      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      hot.setViewState({ version: 1, hiddenColumns: [3] });
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

      const state = throughJson(source.getViewState());

      expect(state.hiddenRows).toEqual([5]);
      expect(state.hiddenColumns).toEqual([3]);
      expect(state.columnWidths).toEqual([[2, 175]]);

      // The target keeps its own order: the parts must land on the same records, not positions.
      const { columnOrder, rowOrder, ...rest } = state;

      target.setViewState(rest);

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

      const { skipped } = hot.setViewState({ version: 1, hiddenRows: [] });

      expect(skipped).toEqual([]);
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
      hot.setViewState({ version: 1, hiddenRows: [2, 4] });
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

      const state = throughJson(source.getViewState());

      expect(state.collapsedRows).toEqual([[1]]);
      expect(target.setViewState(state).skipped).toEqual([]);
      expect(target.getPlugin('nestedRows').getCollapsedParents()).toEqual([3]);
      expect(target.countRows()).toBe(4);
    });

    it('replaces the collapsed parents rather than adding to them', () => {
      const hot = createGrid({ data: createTree(), nestedRows: true, rowHeaders: true });

      hot.getPlugin('nestedRows').collapsingUI.collapseChildren(0);
      hot.setViewState({ version: 1, collapsedRows: [[1]] });

      expect(hot.getPlugin('nestedRows').getCollapsedParents()).toEqual([3]);
    });
  });

  describe('a grid with an external data source', () => {
    it('leaves out and skips the sort, the filters, and the page', () => {
      const hot = createGrid({ ...ALL_PLUGINS, pagination: true });

      hot.addHook('hasExternalDataSource', () => true);

      const state = hot.getViewState();

      expect(Object.keys(state)).not.toContain('sort');
      expect(Object.keys(state)).not.toContain('filters');
      expect(Object.keys(state)).not.toContain('pagination');

      const { skipped } = hot.setViewState({
        version: 1,
        sort: { columns: [{ column: 0, sortOrder: 'desc' }] },
        filters: [],
        pagination: { page: 1, pageSize: 2 },
        hiddenColumns: [1],
      });

      expect(skipped).toEqual([
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
      ['sort', { columns: [{ column: 9, sortOrder: 'asc' }] }],
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

      const before = hot.getViewState();
      const { skipped } = hot.setViewState({ version: 1, [part]: value });

      expect(skipped).toEqual([{ part, reason: part === 'collapsedRows' ? 'pluginDisabled' : 'invalid' }]);
      expect(hot.getViewState()).toEqual(before);
    });

    it('accepts several sort columns when MultiColumnSorting is on', () => {
      const hot = createGrid({ multiColumnSorting: true });
      const columns = [{ column: 1, sortOrder: 'desc' }, { column: 0, sortOrder: 'asc' }];

      expect(hot.setViewState({ version: 1, sort: { columns } }).skipped).toEqual([]);
      expect(hot.getPlugin('multiColumnSorting').getSortConfig()).toEqual(columns);
    });

    it('keeps the current filter when the stored one cannot be imported', () => {
      const hot = createGrid(ALL_PLUGINS);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'eq', ['2-0']);
      filters.filter();

      const { skipped } = hot.setViewState({
        version: 1,
        filters: [{ column: 0, operation: 'conjunction', conditions: [{ name: 'custom-gone', args: [] }] }],
      });

      expect(skipped).toEqual([{ part: 'filters', reason: 'invalid' }]);
      expect(filters.exportConditions()).toEqual([
        { column: 0, operation: 'conjunction', conditions: [{ name: 'eq', args: ['2-0'] }] },
      ]);
      expect(hot.getData()).toEqual([['2-0', '2-1', '2-2', '2-3']]);
    });
  });
});
