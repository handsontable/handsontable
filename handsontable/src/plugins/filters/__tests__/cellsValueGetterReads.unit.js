import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType, DropdownCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(CheckboxCellType);
registerCellType(DropdownCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

/**
 * The filter column read applies a `valueGetter` that the `cells` function sets to every row once
 * `applyCellsToDataReads` is on, so conditions and the value list see what `getDataAtCell()` returns.
 * The grid renders a handful of its 500 rows, so most rows carry no stored cell meta.
 */
describe('Filters -> `cells` valueGetter with `applyCellsToDataReads`', () => {
  const ROWS = 500;

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
   * Returns a `valueGetter` that prefixes the first column's values with `X`.
   *
   * @param {number} row The physical row index.
   * @param {number} column The physical column index.
   * @returns {object}
   */
  function prefixFirstColumn(row, column) {
    return column === 0 ? { valueGetter: value => `X${value}` } : {};
  }

  /**
   * Builds a 500-row grid whose viewport paints only a few rows.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: ROWS }, (_, row) => [`v${row}`, row % 2 === 0 ? 'even' : 'odd']),
      filters: true,
      width: 200,
      height: 100,
      colWidths: 50,
      rowHeights: 23,
      autoColumnSize: false,
      autoRowSize: false,
      applyCellsToDataReads: true,
      cells: prefixFirstColumn,
      licenseKey: TEST_LICENSE_KEY,
      ...overrides,
    });

    return hot;
  }

  it('should read an unrendered row through the getter', () => {
    const filters = buildGrid().getPlugin('filters');

    expect(hot._getMetaManager().getCellMetaIfExists(400, 0)).toBeUndefined();
    expect(filters.getDataMapAtColumn(0)[400].value).toBe('Xv400');
    expect(filters.getDataMapAtColumn(0)[0].value).toBe('Xv0');
  });

  it('should keep an unrendered row whose getter value matches an `eq` condition', () => {
    const filters = buildGrid().getPlugin('filters');

    filters.addCondition(0, 'eq', ['Xv400']);
    filters.filter();

    expect(hot.getData()).toEqual([['Xv400', 'even']]);
    expect(hot.toPhysicalRow(0)).toBe(400);
  });

  it('should keep every row when a `by_value` condition lists every getter value', () => {
    const filters = buildGrid().getPlugin('filters');
    const listed = hot.getDataAtCol(0);

    filters.addCondition(0, 'by_value', [listed]);
    filters.filter();

    expect(hot.countRows()).toBe(ROWS);
  });

  it('should list the getter values while another column has a condition', () => {
    const filters = buildGrid().getPlugin('filters');

    filters.addCondition(1, 'eq', ['even']);
    filters.addCondition(0, 'neq', ['nothing']);
    filters.filter();

    const listed = filters._getValueListDataAtColumn(0).map(({ value }) => value);

    expect(listed).toContain('Xv400');
    expect(listed).not.toContain('v400');
  });

  it('should read a key/value dropdown the `cells` function sets as its label', () => {
    const source = [{ key: 'kg', value: 'Kilogram' }, { key: 'lb', value: 'Pound' }];
    const filters = buildGrid({
      data: Array.from({ length: ROWS }, (_, row) => [source[row % 2]]),
      cells: () => ({ type: 'dropdown', source }),
    }).getPlugin('filters');

    filters.addCondition(0, 'eq', ['Pound']);
    filters.filter();

    expect(hot.countRows()).toBe(ROWS / 2);
    expect(hot.toPhysicalRow(0)).toBe(1);
  });

  it('should apply the getter to a row whose stored meta was never extended', () => {
    const filters = buildGrid().getPlugin('filters');

    hot.setCellMeta(450, 0, 'className', 'marked');

    const entry = filters.getDataMapAtColumn(0, [450])[0];

    expect(entry.value).toBe('Xv450');
    expect(entry.meta.className).toBe('marked');
  });

  it('should hand every row whose value went through the getter a meta object of its own', () => {
    const filters = buildGrid().getPlugin('filters');
    const entries = filters.getDataMapAtColumn(0, [300, 301, 302]);

    expect(entries.map(({ value }) => value)).toEqual(['Xv300', 'Xv301', 'Xv302']);
    expect(new Set(entries.map(({ meta }) => meta)).size).toBe(3);
    expect(entries.map(({ meta }) => meta.row)).toEqual([300, 301, 302]);
  });

  it('should not call the `cells` function for a column without the option', () => {
    const cells = jest.fn(prefixFirstColumn);
    const filters = buildGrid({
      applyCellsToDataReads: false,
      columns: [{ applyCellsToDataReads: true }, {}],
      cells,
    }).getPlugin('filters');

    cells.mockClear();
    filters.getDataMapAtColumn(1, [300, 301]);

    expect(cells).not.toHaveBeenCalled();

    filters.getDataMapAtColumn(0, [300, 301]);

    expect(cells).toHaveBeenCalledTimes(2);
  });

  it('should read a row raw when its own meta turns the option off', () => {
    const filters = buildGrid().getPlugin('filters');

    hot.setCellMeta(450, 0, 'applyCellsToDataReads', false);

    expect(filters.getDataMapAtColumn(0, [449, 450, 451]).map(({ value }) => value))
      .toEqual(['Xv449', 'v450', 'Xv451']);
  });

  it('should run no meta hook and store no cell meta while it calls the `cells` function', () => {
    const beforeGetCellMeta = jest.fn();
    const afterGetCellMeta = jest.fn();
    const filters = buildGrid({ beforeGetCellMeta, afterGetCellMeta }).getPlugin('filters');
    const metaManager = hot._getMetaManager();

    beforeGetCellMeta.mockClear();
    afterGetCellMeta.mockClear();

    expect(filters.getDataMapAtColumn(0, [300, 301]).map(({ value }) => value)).toEqual(['Xv300', 'Xv301']);
    expect(beforeGetCellMeta).not.toHaveBeenCalled();
    expect(afterGetCellMeta).not.toHaveBeenCalled();
    expect(metaManager.getCellMetaIfExists(300, 0)).toBeUndefined();
    expect(metaManager.getCellMetaIfExists(301, 0)).toBeUndefined();
  });

  it('should read raw values, without calling `cells` again, when `cells` itself reads the column', () => {
    const innerValues = [];
    let filters;
    let isReading = false;
    const cells = jest.fn((row, column) => {
      // Read the column from inside `cells` while the outer read runs, the way a `cells` function
      // that looks at its neighbors does. The inner read must not call `cells` again.
      if (isReading && column === 0 && row === 300) {
        innerValues.push(filters.getDataMapAtColumn(0, [300])[0].value);
      }

      return prefixFirstColumn(row, column);
    });

    filters = buildGrid({ cells }).getPlugin('filters');
    cells.mockClear();
    isReading = true;

    const outer = filters.getDataMapAtColumn(0, [300]);

    isReading = false;

    expect(outer[0].value).toBe('Xv300');
    expect(innerValues).toEqual(['v300']);
    expect(cells).toHaveBeenCalledTimes(1);
  });

  describe('with the option off', () => {
    it('should read an unrendered row raw, as before', () => {
      const filters = buildGrid({ applyCellsToDataReads: false }).getPlugin('filters');

      expect(filters.getDataMapAtColumn(0)[400].value).toBe('v400');

      filters.addCondition(0, 'eq', ['Xv400']);
      filters.filter();

      expect(hot.countRows()).toBe(0);
    });
  });
});
