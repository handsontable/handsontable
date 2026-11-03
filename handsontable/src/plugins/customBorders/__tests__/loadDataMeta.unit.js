import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Builds a square dataset.
 *
 * @param {number} size The number of rows and columns.
 * @returns {Array[]}
 */
function square(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (__, col) => `${row}-${col}`));
}

describe('CustomBorders after loadData', () => {
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
   * Builds a grid with a border on the cell (0, 0).
   *
   * @param {object} [settings] Extra settings.
   * @returns {object} The Handsontable instance.
   */
  function create(settings = {}) {
    hot = new Handsontable(container, {
      data: square(6),
      customBorders: [{ row: 0, col: 0, top: { width: 2, color: 'red' } }],
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  it('should restore the `borders` meta that `loadData()` dropped', () => {
    create();
    hot.loadData(square(6));

    expect(hot.getCellMeta(0, 0).borders).toEqual(expect.objectContaining({ row: 0, col: 0 }));
    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should keep the border through a trim of an unrelated row after `loadData()`', () => {
    create();
    hot.loadData(square(6));
    hot.updateSettings({ trimRows: [2] });

    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
    expect(hot.getCellMeta(0, 0).borders).toBeTruthy();
  });

  it('should keep the border through a trim after `loadData()` (the same shape as `updateData()`)', () => {
    create({ trimRows: true });
    hot.loadData(square(6));
    hot.getPlugin('trimRows').trimRow(2);

    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should keep the border through a filter that keeps every row after `loadData()`', () => {
    create({ filters: true });
    hot.loadData(square(6));

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'not_empty', []);
    filters.filter();

    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should keep the border through an untrim after `loadData()`', () => {
    create({ trimRows: true });
    hot.getPlugin('trimRows').trimRow(2);
    hot.loadData(square(6));
    hot.getPlugin('trimRows').untrimAll();

    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should keep the border of a row that stays visible through `trimRow(0); loadData(same)`', () => {
    create({ trimRows: true, customBorders: [{ row: 3, col: 0, top: { width: 2, color: 'red' } }] });
    hot.getPlugin('trimRows').trimRow(0);
    hot.loadData(square(6));

    // `loadData` keeps the border where it was drawn (visual row 2), and now holds it in the meta there.
    expect(hot.getCellMeta(2, 0).borders).toBeTruthy();

    hot.getPlugin('trimRows').trimRow(1);

    expect(hot.getPlugin('customBorders').getBorders().map(({ row }) => row)).toEqual([1]);
  });

  const shapes = [
    { name: 'row and column out of range', entry: { row: 7, col: 7 } },
    { name: 'row out of range only', entry: { row: 7, col: 0 } },
    { name: 'column out of range only', entry: { row: 0, col: 7 } },
    { name: 'row on the boundary', entry: { row: 3, col: 0 } },
  ];

  shapes.forEach(({ name, entry }) => {
    it(`should keep model and meta in agreement for an entry beyond the loaded data (${name})`, () => {
      create({
        data: square(8),
        trimRows: true,
        customBorders: [{ ...entry, top: { width: 2, color: 'red' } }],
      });
      hot.loadData(square(3));

      expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);

      // A regrow through `updateData()` keeps the meta by physical index, so the border is back with its
      // meta, and the next rebuild from the meta (a trim) keeps it.
      hot.updateData(square(8));

      expect(hot.getCellMeta(entry.row, entry.col).borders).toBeTruthy();

      hot.getPlugin('trimRows').trimRow(1);

      expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
      expect(() => hot.getPlugin('customBorders').clearBorders()).not.toThrow();
    });
  });

  it('should restore the meta without firing the cell meta hooks', () => {
    create();

    const before = jest.fn();
    const after = jest.fn();

    hot.addHook('beforeSetCellMeta', before);
    hot.addHook('afterSetCellMeta', after);
    hot.loadData(square(6));

    expect(hot.getCellMeta(0, 0).borders).toBeTruthy();
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it('should keep the border when a `beforeSetCellMeta` listener blocks `borders` edits', () => {
    create();
    hot.addHook('beforeSetCellMeta', (row, column, key) => (key === 'borders' ? false : undefined));
    hot.loadData(square(6));

    expect(hot.getCellMeta(0, 0).borders).toBeTruthy();
    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should keep the border when an `afterLoadData` listener of the app trims first', () => {
    create({ trimRows: true });
    // Registered before the `updateSettings()` below, which re-adds the plugin's own listener after it.
    hot.addHook('afterLoadData', () => {
      hot.getPlugin('trimRows').trimRow(2);
      hot.getPlugin('customBorders').getBorders();
    });
    hot.updateSettings({ customBorders: [{ row: 0, col: 0, top: { width: 2, color: 'red' } }] });
    hot.loadData(square(6));

    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
    expect(hot.getCellMeta(0, 0).borders).toBeTruthy();
  });

  it('should restore the meta for a load made by `_applySettingsAndData()` that declares no borders', () => {
    create();
    hot._applySettingsAndData({}, square(6), 'test');

    expect(hot.getCellMeta(0, 0).borders).toBeTruthy();
    expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(1);
  });

  it('should let a `customBorders` declared in the same `_applySettingsAndData()` call replace the old borders', () => {
    create();

    // A listener that blocks the removal would keep an old border the restore had written into the new data.
    hot.addHook('beforeRemoveCellMeta', (row, column, key) => (key === 'borders' ? false : undefined));
    hot._applySettingsAndData(
      { customBorders: [{ row: 1, col: 1, top: { width: 2, color: 'blue' } }] },
      square(6),
      'test'
    );

    expect(hot.getPlugin('customBorders').getBorders().map(({ row, col }) => [row, col])).toEqual([[1, 1]]);
    expect(hot.getCellMeta(0, 0).borders).toBeFalsy();
    expect(hot.getCellMeta(1, 1).borders).toBeTruthy();
  });

  it('should put the meta on the record a declared `trimRows` leaves at the border\'s visual row', () => {
    create({ trimRows: [1], customBorders: [{ row: 1, col: 0, top: { width: 2, color: 'red' } }] });

    expect(hot.getDataAtCell(1, 0)).toBe('2-0');

    hot.loadData(square(6));

    expect(hot.getDataAtCell(1, 0)).toBe('2-0');
    expect(hot.getCellMeta(1, 0).borders).toBeTruthy();
    expect(hot.getPlugin('customBorders').getBorders().map(({ row }) => row)).toEqual([1]);
  });
});
