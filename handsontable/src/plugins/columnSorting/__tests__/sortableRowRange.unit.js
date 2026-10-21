import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';

// The pinned rows hold MIDDLE values (25 at the top, 35 at the bottom, against 10/20/30/40). With
// extreme values a sort can leave a pinned row where it already sat, and a case would pass whether or
// not the row took part in the sort.
const SEED = [
  ['Header', 25],
  ['Banana', 20],
  ['Apple', 10],
  ['Date', 40],
  ['Cherry', 30],
  ['Total', 35],
];

const PINNED_ASC = [25, 10, 20, 30, 40, 35];
const ALL_ASC = [10, 20, 25, 30, 35, 40];

// `MultiColumnSorting` extends `ColumnSorting` and overrides neither method that decides the sortable
// range, so both plugins must agree on every case below. An override of the upper bound is covered
// in `sortableRowRangeOverride.unit.js`, which has to register a subclass under these same keys.
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('the sortable row range (%s)', (pluginKey, PluginClass) => {
  let container;
  let hot;
  let warnSpy;

  beforeAll(() => {
    registerPlugin(PluginClass);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    warnSpy.mockRestore();
  });

  const build = settings => new Handsontable(container, {
    data: SEED.map(row => [...row]),
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  const upperBound = () => hot.getPlugin(pluginKey).getNumberOfRowsToSort(hot.countRows());
  const sortAsc = () => hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });
  const sortFixedRowsWarnings = () => warnSpy.mock.calls
    .filter(([message]) => String(message).includes('sortFixedRows'));

  describe('the upper bound', () => {
    it('should keep the bottom pinned rows out when the plugin is enabled with `true`', () => {
      // The boolean form carries no sub-options at all, so it must fall back to the default.
      hot = build({ [pluginKey]: true, fixedRowsBottom: 1 });

      expect(upperBound()).toBe(5);
    });

    it('should keep the bottom pinned rows out when `sortFixedRows` is `false`', () => {
      hot = build({ [pluginKey]: { sortFixedRows: false }, fixedRowsBottom: 1 });

      expect(upperBound()).toBe(5);
    });

    it('should take the bottom pinned rows in when `sortFixedRows` is `true`', () => {
      hot = build({ [pluginKey]: { sortFixedRows: true }, fixedRowsBottom: 2 });

      expect(upperBound()).toBe(6);
    });

    it('should honor `sortFixedRows` when `maxRows` equals the row count', () => {
      // Guard: the flag still wins when `maxRows` equals the row count. Old early
      // return was `maxRows - fixedRowsBottom` (5, then 6 with the flag), same as now.
      hot = build({ [pluginKey]: true, fixedRowsBottom: 1, maxRows: 6 });

      expect(upperBound()).toBe(5);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      expect(upperBound()).toBe(6);
    });

    it('should keep the spare row out whether or not `sortFixedRows` is set', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 1 });

      expect(hot.countRows()).toBe(7);
      expect(upperBound()).toBe(6);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      expect(upperBound()).toBe(6);
    });

    it('should not double-subtract a spare row that sits inside `fixedRowsBottom` (DEV-2881)', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 1, fixedRowsBottom: 1 });

      // 6 data rows + 1 spare. Both terms name the last visual row, so the bound is
      // 7 - max(1, 1) = 6. Subtracting them independently would drop `Total` (row 5).
      expect(hot.countRows()).toBe(7);
      expect(upperBound()).toBe(6);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      // The flag zeroes the pinned term; spare rows still stay out of the sort.
      expect(upperBound()).toBe(6);
    });

    it('should exclude the larger of spare rows and `fixedRowsBottom` when there are more spares', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 2, fixedRowsBottom: 1 });

      // 6 data + 2 spares. The spare band already covers the pinned row, so drop 2, not 3.
      expect(hot.countRows()).toBe(8);
      expect(upperBound()).toBe(6);
    });

    it('should exclude the larger of spare rows and `fixedRowsBottom` when more rows are pinned', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 1, fixedRowsBottom: 2 });

      // 6 data + 1 spare. The pinned band covers the spare and `Total`, so drop 2, not 3.
      expect(hot.countRows()).toBe(7);
      expect(upperBound()).toBe(5);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      // The flag zeroes the pinned term; only the spare stays out (bound 6, not 5).
      expect(upperBound()).toBe(6);
    });

    it('should apply the same overlap when `maxRows` caps the displayed count', () => {
      // `countRows()` is already min(length, maxRows); there is no separate formula.
      // Old early return skipped the spare walk: `maxRows - fixedRowsBottom` = 7.
      // Independent subtract: 8 - 2 - 1 = 5. New is `8 - max(2, 1)` = 6 — restoring
      // the early return fails this case.
      hot = build({
        [pluginKey]: true,
        minSpareRows: 2,
        fixedRowsBottom: 1,
        maxRows: 8,
      });

      expect(hot.countRows()).toBe(8);
      expect(upperBound()).toBe(6);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      expect(upperBound()).toBe(6);
    });

    it('should compose `max()` when `maxRows` caps the count and spares outnumber the pin', () => {
      hot = build({
        [pluginKey]: true,
        minSpareRows: 3,
        fixedRowsBottom: 1,
        maxRows: 9,
      });

      // 6 data + 3 spares. Old early return ignored spares: 9 - 1 = 8.
      // Independent subtract double-counted the overlap: 9 - 3 - 1 = 5.
      // Bound is 9 - max(3, 1) = 6.
      expect(hot.countRows()).toBe(9);
      expect(upperBound()).toBe(6);
    });
  });

  describe('the sorted order', () => {
    it('should hold both pinned rows in place by default', () => {
      hot = build({ [pluginKey]: true, fixedRowsTop: 1, fixedRowsBottom: 1 });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(PINNED_ASC);
    });

    it('should sort both pinned rows with the data when `sortFixedRows` is `true`', () => {
      hot = build({ [pluginKey]: { sortFixedRows: true }, fixedRowsTop: 1, fixedRowsBottom: 1 });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(ALL_ASC);
    });

    it('should read `sortFixedRows` at sort time', () => {
      hot = build({ [pluginKey]: true, fixedRowsTop: 1, fixedRowsBottom: 1 });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(PINNED_ASC);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });
      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(ALL_ASC);
    });

    it('should sort the last data row when a spare row overlaps `fixedRowsBottom` (DEV-2881)', () => {
      // `Total` holds 35, in the middle of 10/20/30/40. If the overlap dropped it from
      // the sort it would stay at visual row 5; taking part puts it between 30 and 40.
      hot = build({ [pluginKey]: true, minSpareRows: 1, fixedRowsBottom: 1 });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual([10, 20, 25, 30, 35, 40, null]);
    });

    it('should keep spare rows last when `maxRows` caps the count even with `sortEmptyCells`', () => {
      hot = build({
        [pluginKey]: { sortEmptyCells: true },
        minSpareRows: 2,
        maxRows: 8,
      });

      sortAsc();

      // Old early return left the two spares in the sortable range, so they
      // would rise to the top. They stay last because the bound is 6.
      expect(hot.getDataAtCol(1)).toEqual([10, 20, 25, 30, 35, 40, null, null]);
    });

    it('should keep `Total` pinned when `fixedRowsBottom` is wider than the spare band', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 1, fixedRowsBottom: 2 });

      sortAsc();

      // Rows 5 (`Total`, 35) and 6 (spare) are the pinned band. Cherry (30) must sort.
      expect(hot.getDataAtCol(1)).toEqual([10, 20, 25, 30, 40, 35, null]);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });
      sortAsc();

      // `Total` is no longer pinned; the spare still stays last.
      expect(hot.getDataAtCol(1)).toEqual([10, 20, 25, 30, 35, 40, null]);
    });
  });

  describe('`sortFixedRows` set inside `columns`', () => {
    it('should be ignored, and warn once, when `columns` is an array', () => {
      hot = build({
        [pluginKey]: true,
        fixedRowsTop: 1,
        fixedRowsBottom: 1,
        columns: [{}, { [pluginKey]: { sortFixedRows: true } }],
      });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(PINNED_ASC);

      // A settings update rebuilds the column meta cache, which resolves every column config again.
      hot.updateSettings({ fixedRowsTop: 1 });
      sortAsc();

      expect(sortFixedRowsWarnings()).toHaveLength(1);
      expect(sortFixedRowsWarnings()[0][0]).toContain(`grid-level \`${pluginKey}\``);
    });

    it('should be ignored, and warn once, when `columns` is a function', () => {
      hot = build({
        [pluginKey]: true,
        fixedRowsTop: 1,
        fixedRowsBottom: 1,
        columns: column => (column === 1 ? { [pluginKey]: { sortFixedRows: true } } : {}),
      });

      sortAsc();

      expect(hot.getDataAtCol(1)).toEqual(PINNED_ASC);

      // Without this rebuild the function form resolves each column once, and "once" would hold
      // whether or not the warning is deduplicated.
      hot.updateSettings({ fixedRowsTop: 1 });
      sortAsc();

      expect(sortFixedRowsWarnings()).toHaveLength(1);
    });

    it('should not warn when the option is set at the grid level only', () => {
      hot = build({
        [pluginKey]: { sortFixedRows: true },
        columns: [{}, { [pluginKey]: { indicator: false } }],
      });

      sortAsc();

      expect(sortFixedRowsWarnings()).toHaveLength(0);
    });
  });
});
