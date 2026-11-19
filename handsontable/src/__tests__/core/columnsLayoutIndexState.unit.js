import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  ColumnSorting,
  HiddenColumns,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  HiddenRows,
  Filters,
  DropdownMenu,
  AutoColumnSize,
} from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerPlugin(ColumnSorting);
registerPlugin(HiddenColumns);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowMove);
registerPlugin(HiddenRows);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerCellType(CheckboxCellType);

const ALL_COLUMNS = ['a', 'b', 'c', 'd'];
const WITHOUT_FIRST = ['b', 'c', 'd'];

/**
 * Builds the rows of a grid whose columns are the given property names.
 *
 * @param {string[]} props The property names.
 * @returns {object[]} A new array of new row objects, so each call hands the grid a new `data` reference.
 */
function buildData(props) {
  return [3, 1, 2].map(rank => Object.fromEntries(props.map(prop => [prop, `${prop}${rank}`])));
}

/**
 * Builds the `columns` option for the given property names, as a new array of new objects.
 *
 * @param {string[]} props The property names.
 * @returns {object[]}
 */
function buildColumns(props) {
  return props.map(data => ({ data }));
}

/**
 * The React wrapper forwards `data` with every `updateSettings()` call, so a change of its `columns` prop reaches
 * the core as `{ data, columns }`. A payload with `columns` alone already starts the index state over (width, hiding,
 * sorting), and a payload with both must do the same when the column layout changed. Without that, the state stays
 * on the physical index and lands on the column that took the removed one's place.
 */
describe('updateSettings() with data and columns', () => {
  let hot;

  /**
   * Creates the grid with the state this suite moves around: the plugins that keep it in index maps.
   *
   * @param {object} [settings] Extra settings.
   * @returns {Handsontable} The instance.
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(document.createElement('div'), {
      licenseKey: TEST_LICENSE_KEY,
      data: buildData(ALL_COLUMNS),
      columns: buildColumns(ALL_COLUMNS),
      manualColumnResize: true,
      manualColumnMove: true,
      hiddenColumns: true,
      columnSorting: true,
      ...settings,
    });

    return hot;
  }

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  describe('when a middle column is removed', () => {
    const REMAINING = WITHOUT_FIRST;

    it('should start a manual width over instead of moving it onto the next column', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      // The control state: the width sits on column C, so the assertions below cannot pass on a move that never ran.
      expect(hot.getColWidth(2)).toBe(222);

      hot.updateSettings({ data: buildData(REMAINING), columns: buildColumns(REMAINING) });

      expect(hot.countCols()).toBe(3);
      expect(hot.getColWidth(0)).not.toBe(222);
      expect(hot.getColWidth(1)).not.toBe(222);
      expect(hot.getColWidth(2)).not.toBe(222);
    });

    it('should start the column order over instead of keeping the moved columns', () => {
      createGrid();
      hot.getPlugin('manualColumnMove').moveColumn(2, 0);
      hot.render();

      expect(hot.toPhysicalColumn(0)).toBe(2);

      hot.updateSettings({ data: buildData(REMAINING), columns: buildColumns(REMAINING) });

      expect([0, 1, 2].map(column => hot.toPhysicalColumn(column))).toEqual([0, 1, 2]);
    });

    it('should start a hidden column over instead of hiding the next column', () => {
      createGrid();
      hot.getPlugin('hiddenColumns').hideColumn(2);

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);

      hot.updateSettings({ data: buildData(REMAINING), columns: buildColumns(REMAINING) });

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
    });

    it('should start the sorting over, indicator and row order together', () => {
      createGrid();
      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);

      hot.updateSettings({ data: buildData(REMAINING), columns: buildColumns(REMAINING) });

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      // The rows are in the order of the data that was just loaded, not of the column that was sorted before.
      expect(hot.getDataAtCol(0)).toEqual(['b3', 'b1', 'b2']);
    });
  });

  describe('when the layout does not change', () => {
    it('should keep the state when `columns` is a new array with the same properties', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);
      hot.getPlugin('hiddenColumns').hideColumn(1);
      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: buildColumns(ALL_COLUMNS) });

      expect(hot.getColWidth(2)).toBe(222);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
    });

    it('should keep the state when the same columns hold new inline functions', () => {
      // A wrapper that writes `renderer` inline sends a new function on every render, so a reset keyed on the
      // reference of `columns` would wipe what the user did on every render.
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      const inlineColumns = () => ALL_COLUMNS.map(data => ({
        data,
        renderer: (...args) => Handsontable.renderers.TextRenderer(...args),
      }));

      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: inlineColumns() });
      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: inlineColumns() });

      expect(hot.getColWidth(2)).toBe(222);
    });
  });

  describe('when a column is appended', () => {
    it('should keep the state and size the index mappers for the new column', () => {
      createGrid({ columns: buildColumns(['a', 'b', 'c']), data: buildData(['a', 'b', 'c']) });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);
      hot.getPlugin('hiddenColumns').hideColumn(1);
      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: buildColumns(ALL_COLUMNS) });

      expect(hot.countCols()).toBe(4);
      expect(hot.columnIndexMapper.getNumberOfIndexes()).toBe(4);
      expect(hot.getColWidth(2)).toBe(222);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      // The appended column is a real, readable one.
      expect(hot.getDataAtCol(3)).toEqual(expect.arrayContaining(['d1', 'd2', 'd3']));
    });
  });

  describe('when the same `columns` array is mutated before the update', () => {
    it('should keep the state when a column was appended to it in place', () => {
      // The React wrapper builds `columns` from its `<HotColumn>` children in one array and appends to that array
      // before it calls `updateSettings()`, so the grid already holds the longer array while its index mappers
      // still have the old length.
      const columns = buildColumns(ALL_COLUMNS);

      createGrid({ columns });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);
      hot.getPlugin('hiddenColumns').hideColumn(1);

      columns.push({ data: 'e' });
      hot.updateSettings({ data: buildData([...ALL_COLUMNS, 'e']), columns });

      expect(hot.countCols()).toBe(5);
      expect(hot.getColWidth(2)).toBe(222);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
    });

    it('should start the state over when a column was removed from it in place', () => {
      const columns = buildColumns(ALL_COLUMNS);

      createGrid({ columns });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      columns.shift();
      hot.updateSettings({ data: buildData(WITHOUT_FIRST), columns });

      expect(hot.getColWidth(2)).not.toBe(222);
    });
  });

  describe('when `minSpareCols` adds a column to the index mappers', () => {
    it('should keep the state of an unchanged `columns` array', () => {
      // The mappers are longer than the `columns` array here, so their length is not the layout's column count.
      createGrid({ minSpareCols: 1 });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: buildColumns(ALL_COLUMNS) });

      expect(hot.getColWidth(2)).toBe(222);
    });
  });

  describe('when the layout changes without removing a column', () => {
    it('should start the state over when a property is renamed', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({
        data: buildData(['a', 'b', 'x', 'd']),
        columns: buildColumns(['a', 'b', 'x', 'd']),
      });

      expect(hot.getColWidth(2)).not.toBe(222);
    });

    it('should start the state over when a column without a property is replaced by one that reads another column', () => {
      // `colToPropCache` is sparse for a column that declares no `data`. A comparison that skips the holes reads the
      // layouts below as equal.
      createGrid({
        data: [['a0', 'b0', 'c0'], ['a1', 'b1', 'c1']],
        columns: [{ data: 0 }, {}, { data: 2 }],
      });
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);

      hot.updateSettings({
        data: [['a0', 'b0', 'c0'], ['a1', 'b1', 'c1']],
        columns: [{ data: 0 }, { data: 2 }, { data: 2 }],
      });

      expect(hot.getColWidth(1)).not.toBe(222);
    });

    it('should keep the state when a column of array data gains the `data` index it already read', () => {
      // On rows that are arrays, a column without `data` reads the source column at its own index.
      createGrid({
        data: [['a0', 'b0'], ['a1', 'b1']],
        columns: [{ data: 0 }, { data: 1 }],
      });
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);

      hot.updateSettings({ data: [['a0', 'b0'], ['a1', 'b1']], columns: [{}, {}] });

      expect(hot.getColWidth(1)).toBe(222);
    });
  });

  describe('when columns are removed from the end', () => {
    it('should keep the width, hiding, and sorting of the columns that remain', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);
      hot.getPlugin('hiddenColumns').hideColumn(0);
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

      hot.updateSettings({ data: buildData(['a', 'b', 'c']), columns: buildColumns(['a', 'b', 'c']) });

      expect(hot.countCols()).toBe(3);
      expect(hot.getColWidth(1)).toBe(222);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    });

    it('should start the state over when a remaining column also changed its property', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);

      hot.updateSettings({ data: buildData(['a', 'x', 'c']), columns: buildColumns(['a', 'x', 'c']) });

      expect(hot.getColWidth(1)).not.toBe(222);
    });
  });

  describe('rows', () => {
    it('should keep the moved and the hidden rows when a column is removed', () => {
      createGrid({ manualRowMove: true, hiddenRows: true });
      hot.getPlugin('manualRowMove').moveRows([2], 0);
      hot.getPlugin('hiddenRows').hideRow(1);
      hot.render();

      const sequence = hot.rowIndexMapper.getIndexesSequence();

      expect(sequence).not.toEqual([0, 1, 2]);

      hot.updateSettings({ data: buildData(WITHOUT_FIRST), columns: buildColumns(WITHOUT_FIRST) });

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual(sequence);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([1]);
    });

    it('should keep the generated row ids when a column is removed', () => {
      const afterRowIdsRemoved = jest.fn();

      createGrid({ rowId: true, afterRowIdsRemoved });
      const ids = [0, 1, 2].map(row => hot.getRowId(row));

      // The data gains a row in the same call, as a row count change makes the generated ids start over.
      hot.updateSettings({
        data: [...buildData(WITHOUT_FIRST), { b: 'b9', c: 'c9', d: 'd9' }],
        columns: buildColumns(WITHOUT_FIRST),
      });

      expect([0, 1, 2].map(row => hot.getRowId(row))).toEqual(ids);
      expect(afterRowIdsRemoved).not.toHaveBeenCalled();
    });

    it('should show the rows a filter trimmed when its conditions go with the columns', () => {
      createGrid({ filters: true, data: [1, 2, 3, 4, 5, 6].map(n => ({ a: n, b: n, c: n, d: n })) });
      hot.getPlugin('filters').addCondition(2, 'gt', [3]);
      hot.getPlugin('filters').filter();

      expect(hot.countRows()).toBe(3);

      hot.updateSettings({
        data: [1, 2, 3, 4, 5, 6].map(n => ({ b: n, c: n, d: n })),
        columns: buildColumns(WITHOUT_FIRST),
      });

      expect(hot.getPlugin('filters').exportConditions()).toEqual([]);
      expect(hot.countRows()).toBe(6);
    });

    it('should keep the rows a filter trimmed when the columns do not change', () => {
      createGrid({ filters: true, data: [1, 2, 3, 4, 5, 6].map(n => ({ a: n, b: n, c: n, d: n })) });
      hot.getPlugin('filters').addCondition(2, 'gt', [3]);
      hot.getPlugin('filters').filter();

      hot.updateSettings({
        data: [1, 2, 3, 4, 5, 6].map(n => ({ a: n, b: n, c: n, d: n })),
        columns: buildColumns(ALL_COLUMNS),
      });

      expect(hot.getPlugin('filters').exportConditions()).toHaveLength(1);
      expect(hot.countRows()).toBe(3);
    });

    it('should bring the rows back to their unsorted order when the sort is cleared with the columns', () => {
      createGrid();
      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      expect(hot.getDataAtCol(0)).toEqual(['a1', 'a2', 'a3']);

      hot.updateSettings({ data: buildData(WITHOUT_FIRST), columns: buildColumns(WITHOUT_FIRST) });

      expect(hot.getDataAtCol(0)).toEqual(['b3', 'b1', 'b2']);
    });
  });

  describe('when the payload is not a plain `columns` array', () => {
    it('should keep the state when a column reads through an accessor function written inline', () => {
      // The accessor is a new function on every render, so a comparison by identity would reset on each one.
      const accessorColumns = () => [
        { data: 'a' },
        { data: row => row.b },
        { data: 'c' },
      ];

      createGrid({ data: buildData(['a', 'b', 'c']), columns: accessorColumns() });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({ data: buildData(['a', 'b', 'c']), columns: accessorColumns() });

      expect(hot.getColWidth(2)).toBe(222);
    });

    it('should leave the state of a `columns` function alone, as before layouts were compared', () => {
      // Counting the columns of the function form calls it once per source column, so the update does not read the
      // layout. Read, the narrower source below would count as a changed layout and reset the width.
      const columns = () => ({});

      createGrid({ data: [['a', 'b', 'c'], ['d', 'e', 'f']], columns });
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);

      hot.updateSettings({ data: [['a', 'b'], ['d', 'e']], columns: () => ({}) });

      expect(hot.countCols()).toBe(2);
      expect(hot.getColWidth(1)).toBe(222);
    });

    it('should leave the state alone for `data`, `dataSchema`, and a `columns` function on a grid without `columns`', () => {
      // The schema leg of the comparison reads the layout only when `columns` stays out of the picture, so the function
      // form does not turn it into a reset.
      createGrid({ data: [['a', 'b', 'c'], ['d', 'e', 'f']], columns: undefined });
      hot.getPlugin('manualColumnResize').setManualSize(1, 222);

      hot.updateSettings({
        data: [['a', 'b'], ['d', 'e']],
        dataSchema: [null, null],
        columns: () => ({}),
      });

      expect(hot.countCols()).toBe(2);
      expect(hot.getColWidth(1)).toBe(222);
    });

    it('should start the state over for `data`, `dataSchema` and `columns` sent together', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({
        data: buildData(WITHOUT_FIRST),
        dataSchema: { b: null, c: null, d: null },
        columns: buildColumns(WITHOUT_FIRST),
      });

      expect(hot.getColWidth(2)).not.toBe(222);
    });

    it('should start the state over when `columns` is cleared beside `data` that has fewer columns', () => {
      createGrid();
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({ data: [['b', 'c', 'd'], ['b', 'c', 'd']], columns: null });

      expect(hot.countCols()).toBe(3);
      expect(hot.getColWidth(2)).not.toBe(222);
    });

    it('should keep the state when `maxCols` clamps the same `columns` array', () => {
      createGrid({ maxCols: 3 });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({ data: buildData(ALL_COLUMNS), columns: buildColumns(ALL_COLUMNS) });

      expect(hot.getColWidth(2)).toBe(222);
    });

    it('should keep the state when `columns` first names as many columns as the array data already had', () => {
      // Array data reads through the indexes and a `columns` entry without `data` names none, so neither layout
      // has a property to compare, and the number of columns is the same.
      createGrid({ data: [['a', 'b', 'c']], columns: undefined });
      hot.getPlugin('manualColumnResize').setManualSize(2, 222);

      hot.updateSettings({ data: [['a', 'b', 'c']], columns: [{}, {}, {}] });

      expect(hot.getColWidth(2)).toBe(222);
    });
  });
});
