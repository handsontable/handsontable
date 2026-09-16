import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

/**
 * Coverage for DEV-2524, the row half: `filters: { filterFixedRows: false }` keeps the rows pinned
 * by `fixedRowsTop` / `fixedRowsBottom` out of the filter, both as rows that can be trimmed and as
 * values the "filter by value" list offers.
 *
 * The seed data is built so every assertion can fail. The pinned rows carry `Gold` and `Silver`,
 * which the `Red` condition below EXCLUDES - so a missing exemption makes them disappear - and
 * those two values appear nowhere else, so a value-list assertion cannot pass by accident.
 */
describe('Filters -> filterFixedRows', () => {
  const DATA = [
    ['Header', 25, 'Gold'],
    ['Banana', 20, 'Green'],
    ['Apple', 10, 'Red'],
    ['Date', 40, 'Green'],
    ['Cherry', 30, 'Red'],
    ['Total', 35, 'Silver'],
  ];

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
   * Builds a grid over the seed data with one pinned row at each end.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: DATA.map(row => row.slice()),
      colHeaders: ['Fruit', 'Amount', 'Color'],
      dropdownMenu: true,
      filters: true,
      fixedRowsTop: 1,
      fixedRowsBottom: 1,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  describe('trimming', () => {
    it('should filter the pinned rows away by default', () => {
      const filters = buildGrid().getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      // `Header` (Gold) and `Total` (Silver) do not match, so today they are trimmed. This pins the
      // default, which must not change.
      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry']);
    });

    it('should keep the pinned rows when filterFixedRows is false', () => {
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
    });

    it('should still trim the data rows that do not match', () => {
      // The pinned rows are exempt; everything else must filter exactly as before. Without this,
      // an exemption that accidentally covered every row would pass the test above.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Green']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Banana', 'Date', 'Total']);
    });

    it('should keep the pinned rows when nothing matches at all', () => {
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Purple']);
      filters.filter();

      // Every data row is gone, but the two pinned rows are not - and the selection must survive,
      // because the grid is not empty. `!rowIndexesToShow.length` alone would have deselected here.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Total']);
    });

    it('should not pin every row when only fixedRowsTop is set', () => {
      // `slice(-0)` returns the WHOLE array. An unguarded bottom slice would pin all six rows here
      // and the filter would hide nothing.
      const filters = buildGrid({
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);
    });

    it('should honor more than one pinned row at each end', () => {
      const filters = buildGrid({
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      // Rows 0, 1, 4 and 5 are pinned; only row 2 (Apple, Red) matches among the rest, and row 3
      // (Date, Green) is trimmed.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Banana', 'Apple', 'Cherry', 'Total']);
    });

    it('should recompute which rows are pinned on every filter', () => {
      // The pinned set is read from the live grid settings each time `filter()` runs, never
      // captured when the plugin was enabled. Changing `fixedRowsBottom` under an applied filter
      // is what proves it: `fixedRowsBottom` is not one of the plugin's `SETTING_KEYS`, so this
      // `updateSettings` does NOT re-enable the plugin and the condition survives it.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

      hot.updateSettings({ fixedRowsBottom: 0 });
      filters.filter();

      // `Total` is no longer pinned, so the `Red` condition finally reaches it.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);

      // And back again - unpinning is not a one-way door.
      hot.updateSettings({ fixedRowsBottom: 1 });
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
    });

    it('should apply the option when it arrives through updateSettings', () => {
      // A payload carrying the `filters` key runs the plugin's disable/enable cycle, which clears
      // the condition collection - so the condition has to be added after the update, not before.
      const filters = buildGrid().getPlugin('filters');

      hot.updateSettings({ filters: { filterFixedRows: false } });

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
    });

    it('should reject a non-boolean value and keep the default', () => {
      const filters = buildGrid({ filters: { filterFixedRows: 'yes' } }).getPlugin('filters');

      expect(filters.getSetting('filterFixedRows')).toBe(true);
    });
  });

  describe('"filter by value" list', () => {
    it('should list the pinned rows\' values by default', () => {
      const filters = buildGrid().getPlugin('filters');
      const values = filters._getValueListDataAtColumn(2).map(({ value }) => value);

      expect(values).toEqual(['Gold', 'Green', 'Red', 'Green', 'Red', 'Silver']);
    });

    it('should drop the pinned rows\' values when filterFixedRows is false', () => {
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');
      const values = filters._getValueListDataAtColumn(2).map(({ value }) => value);

      // `Gold` and `Silver` exist only in the pinned rows, so their absence cannot be accidental.
      expect(values).toEqual(['Green', 'Red', 'Green', 'Red']);
    });

    it('should drop them on the has-conditions branch too', () => {
      // A column carrying conditions of its own reads its list through `getDataMapAtColumn()`
      // rather than `getDataAtCol()`. That is a different code path and needs its own case.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      const values = filters._getValueListDataAtColumn(2).map(({ value }) => value);

      expect(values).toEqual(['Green', 'Red', 'Green', 'Red']);
    });

    it('should drop them for a column filtered by another column', () => {
      // Column 2 has no conditions, so it reads the VISIBLE rows. Column 1's filter narrows those,
      // and the pinned rows still have to come off the ends.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(1, 'gt', [15]);
      filters.filter();

      // Visible rows are Header, Banana, Date, Cherry, Total; the two pinned ones drop out.
      const values = filters._getValueListDataAtColumn(2).map(({ value }) => value);

      expect(values).toEqual(['Green', 'Green', 'Red']);
    });
  });
});
