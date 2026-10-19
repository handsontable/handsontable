import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { NestedRows } from 'handsontable/plugins/nestedRows';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { Filters } from 'handsontable/plugins/filters';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(NestedRows);
registerPlugin(TrimRows);
registerPlugin(Filters);

/**
 * `getDataAtCol()` and `getDataAtProp()` read one value per visual row. With NestedRows the visual
 * rows outnumber the top-level records of the source array, so a range sized by that array dropped
 * every row past its length.
 */
describe('Core#getDataAtCol() and Core#getDataAtProp() row count', () => {
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
   * Builds a grid with one `name` column.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function build(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  /**
   * Builds the three-level tree `P1 > C11 > G1`, `P2 > C21` (5 rows, 2 top-level records).
   *
   * @returns {object} The Handsontable instance.
   */
  function buildTree() {
    return build({
      nestedRows: true,
      rowHeaders: true,
      columns: [{ data: 'name' }],
      data: [
        { name: 'P1', __children: [{ name: 'C11', __children: [{ name: 'G1' }] }] },
        { name: 'P2', __children: [{ name: 'C21' }] },
      ],
    });
  }

  /**
   * Reads the first column through `getData()`, which already covers every visual row.
   *
   * @returns {Array} The column values.
   */
  function firstColumnFromGetData() {
    return hot.getData().map(row => row[0]);
  }

  it('should return a child row of the only top-level record', () => {
    build({
      nestedRows: true,
      columns: [{ data: 'name' }],
      data: [{ name: 'P1', __children: [{ name: 'C1' }] }],
    });

    expect(hot.countRows()).toBe(2);
    expect(hot.getDataAtCol(0)).toEqual(['P1', 'C1']);
    expect(hot.getDataAtProp('name')).toEqual(['P1', 'C1']);
  });

  it('should return every row of a multi-level tree, later parents included', () => {
    buildTree();

    const expected = ['P1', 'C11', 'G1', 'P2', 'C21'];

    expect(firstColumnFromGetData()).toEqual(expected);
    expect(hot.getDataAtCol(0)).toEqual(expected);
    expect(hot.getDataAtProp('name')).toEqual(expected);
  });

  it('should follow the visible rows when a parent is collapsed', () => {
    buildTree();

    hot.getPlugin('nestedRows').collapseParent(0);

    expect(hot.getDataAtCol(0)).toEqual(['P1', 'P2', 'C21']);
    expect(hot.getDataAtProp('name')).toEqual(['P1', 'P2', 'C21']);
  });

  it('should return every row after a child is detached from its parent', () => {
    buildTree();

    const plugin = hot.getPlugin('nestedRows');

    plugin.dataManager.detachFromParent(plugin.dataManager.getDataObject(1));

    const expected = ['P1', 'P2', 'C21', 'C11', 'G1'];

    expect(firstColumnFromGetData()).toEqual(expected);
    expect(hot.getDataAtCol(0)).toEqual(expected);
    expect(hot.getDataAtProp('name')).toEqual(expected);
  });

  it('should stop at the row limit when it is below the number of top-level records', () => {
    build({
      nestedRows: true,
      maxRows: 2,
      columns: [{ data: 'name' }],
      data: [
        { name: 'P1', __children: [{ name: 'C1' }] },
        { name: 'P2' },
        { name: 'P3' },
      ],
    });

    expect(hot.countRows()).toBe(2);
    expect(hot.getDataAtCol(0)).toEqual(['P1', 'C1']);
    expect(hot.getDataAtProp('name')).toEqual(['P1', 'C1']);
  });

  it('should list every row in the Filters value list of a column with no conditions', () => {
    buildTree();
    hot.updateSettings({ filters: true });

    const values = hot.getPlugin('filters')._getValueListDataAtColumn(0).map(({ value }) => value);

    expect(values).toEqual(['P1', 'C11', 'G1', 'P2', 'C21']);
  });

  it('should shift every row of the column in spliceCol()', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    buildTree();
    hot.spliceCol(0, 1, 1);
    warnSpy.mockRestore();

    expect(hot.getDataAtCol(0)).toEqual(['P1', 'G1', 'P2', 'C21', null]);
  });

  describe('grids without NestedRows keep their results', () => {
    // A known quirk kept as it was, not a wanted result: with no rows the range ends at `-1`, so
    // `getRange()` starts at the header row and reads one value. `getDataAtProp()` finds no column
    // in an empty data set and returns before it reads a range.
    it('should return `[null]` from getDataAtCol() for an empty data set', () => {
      build({ data: [] });

      expect(hot.getDataAtCol(0)).toEqual([null]);
      expect(hot.getDataAtProp(0)).toEqual([]);
    });

    // Pins the source length in the range end: a range sized by `countRows()` alone ends at `-1`
    // here and returns `[null]` too.
    it('should return `[]` when every row is trimmed', () => {
      build({ data: [['a'], ['b']], trimRows: [0, 1] });

      expect(hot.getDataAtCol(0)).toEqual([]);
      expect(hot.getDataAtProp(0)).toEqual([]);
    });

    it('should skip trimmed rows', () => {
      build({ data: [['a'], ['b'], ['c']], trimRows: [1] });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'c']);
      expect(hot.getDataAtProp(0)).toEqual(['a', 'c']);
    });

    it('should include spare rows', () => {
      build({ data: [['a'], ['b']], minSpareRows: 2 });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', null, null]);
      expect(hot.getDataAtProp(0)).toEqual(['a', 'b', null, null]);
    });

    it('should stop at the row limit', () => {
      build({ data: [['a'], ['b'], ['c']], maxRows: 2 });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b']);
      expect(hot.getDataAtProp(0)).toEqual(['a', 'b']);
    });
  });
});
