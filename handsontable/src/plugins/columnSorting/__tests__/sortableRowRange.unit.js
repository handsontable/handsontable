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

    it('should honor `sortFixedRows` on the `maxRows` branch', () => {
      // `maxRows` equal to the row count takes a separate early return.
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

    it('should subtract the spare row and the bottom pinned row separately (DEV-2881)', () => {
      hot = build({ [pluginKey]: true, minSpareRows: 1, fixedRowsBottom: 1 });

      // This pins the CURRENT, known-wrong result. Both terms count from the bottom and name the same
      // row, so one real data row drops out of the sort: the correct bound is 7 - max(1, 1) = 6. When
      // DEV-2881 is fixed, this expectation must change to 6.
      expect(upperBound()).toBe(5);

      hot.updateSettings({ [pluginKey]: { sortFixedRows: true } });

      // With the flag on the bottom term is zeroed, so the overlap disappears here.
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
