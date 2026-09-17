import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(TrimRows);
registerPlugin(ColumnSorting);
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

    it('should re-apply the exemption when fixedRows* changes, without a manual filter() call', () => {
      // The exemption is applied while filtering, so a change to WHICH rows are pinned has to run
      // the filter again by itself. Calling `filter()` by hand after the update would hide the bug
      // this covers: an `updateSettings` on its own used to leave the previous pass's answer in the
      // trimming map, so the frozen pane showed a data row while the real footer stayed trimmed.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

      hot.updateSettings({ fixedRowsBottom: 0 });

      // `Total` is no longer pinned, so the `Red` condition finally reaches it.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);

      // And back again - unpinning is not a one-way door.
      hot.updateSettings({ fixedRowsBottom: 1 });
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
    });

    it('should re-apply the exemption after a row is removed from the end', () => {
      // The row order matters here: removing the pinned footer must promote a row that the filter
      // had ALREADY trimmed. Promoting a row that matched anyway leaves the same rows on screen
      // either way, and the test could not tell a re-filter from a stale trimming map.
      const filters = buildGrid({
        data: [
          ['Header', 25, 'Gold'],
          ['Apple', 10, 'Red'],
          ['Cherry', 30, 'Red'],
          ['Date', 40, 'Green'],
          ['Total', 35, 'Silver'],
        ],
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

      // Visual row 3 is `Total` in the filtered view - the grid shows four rows at this point, so
      // there is no visual row 4 to remove.
      hot.alter('remove_row', 3);

      // `Date` is the last row now, so it is pinned and comes back despite being Green.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Date']);
    });

    it('should re-apply the exemption after a sort moves other rows to the ends', () => {
      // `sortFixedRows: true` is what makes a sort able to change WHICH rows are pinned at all -
      // under its default the sorting plugin holds the frozen rows in place too, so the pinned set
      // never moves and this test could not fail.
      const filters = buildGrid({
        columnSorting: { sortFixedRows: true },
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

      // Descending by Fruit moves `Total` to the top and `Apple` to the bottom, so `Header` stops
      // being pinned - and it is Gold, which the condition excludes. A stale trimming map would
      // keep showing it, which is what makes this able to fail.
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      expect(hot.getDataAtCol(0)).not.toContain('Header');
    });

    it('should re-apply the exemption when the last frozen row is unpinned', () => {
      // Setting the last `fixedRows*` count to 0 makes the pinned set empty, which reads exactly
      // like "the grid never opted in". Treating the two the same skips the re-filter, so a row
      // that was exempt stays on screen although nothing pins it any more.
      const filters = buildGrid({
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);

      hot.updateSettings({ fixedRowsTop: 0 });

      // `Header` is Gold, so with nothing pinned the condition finally reaches it.
      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry']);
    });

    it('should not re-filter when the option is off', () => {
      // The re-filter is gated so a grid that never opted in pays nothing. With the default, an
      // `updateSettings` carrying `fixedRows*` must leave the filtered result exactly as it was.
      const filters = buildGrid().getPlugin('filters');
      const filterSpy = jest.spyOn(filters, 'filter');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();
      filterSpy.mockClear();

      hot.updateSettings({ fixedRowsBottom: 0 });

      expect(filterSpy).not.toHaveBeenCalled();
      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry']);

      filterSpy.mockRestore();
    });

    it('should not re-filter when the option is on but nothing is filtered', () => {
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');
      const filterSpy = jest.spyOn(filters, 'filter');

      hot.updateSettings({ fixedRowsBottom: 0 });

      expect(filterSpy).not.toHaveBeenCalled();

      filterSpy.mockRestore();
    });

    it('should pin the rows the grid SHOWS, not the raw index order', () => {
      // `trimRows` removes row 0 from view, so the row frozen at the top is physical row 1
      // (Banana/Green). Reading the raw index sequence instead pins row 0 - a row that is already
      // invisible - and lets the condition filter the row the user can actually see.
      const filters = buildGrid({
        trimRows: [0],
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      // Banana is pinned and survives despite being Green; Date (also Green) is filtered out.
      expect(hot.getDataAtCol(0)).toEqual(['Banana', 'Apple', 'Cherry']);
    });

    it('should pin the whole frozen SPAN, including a row HiddenRows hides inside it', () => {
      // The exemption is positional: visual rows [0, fixedRowsTop-1]. That is the same span
      // `countNotHiddenFixedRowsTop()` measures, and the span never stretches to make up for a
      // hidden row inside it - with row 0 hidden and `fixedRowsTop: 2` the pane paints ONE row,
      // visual row 1. So the painted row must be exempt, and the hidden row stays exempt too.
      // Exempting only the painted row would trim `Header`, which reappears inside the frozen pane
      // the moment it is un-hidden.
      const filters = buildGrid({
        fixedRowsTop: 2,
        fixedRowsBottom: 0,
        hiddenRows: { rows: [0] },
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      expect(hot.view.countNotHiddenFixedRowsTop()).toBe(1);

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      // Banana is the row the frozen pane paints: Green, yet it survives. Header is hidden inside
      // the span and survives too. Date is Green and outside the span, so it goes.
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Banana', 'Apple', 'Cherry']);
    });

    it('should keep the selection when only pinned rows are left', () => {
      // The deselect guard used to read "no row matched the conditions", which is no longer the
      // same question once pinned rows are exempt. Selecting first is what makes this able to fail.
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');

      hot.selectCell(0, 0);

      filters.addCondition(2, 'eq', ['Purple']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Total']);
      expect(hot.getSelectedLast()).toBeDefined();
    });

    it('should treat a non-numeric fixedRowsTop as zero, like the table view does', () => {
      // `Math.max(0, NaN)` is NaN, which silently empties the value-list loop that counts up to it.
      const filters = buildGrid({
        fixedRowsTop: 'abc',
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      expect(filters._getValueListDataAtColumn(2).map(({ value }) => value))
        .toEqual(['Gold', 'Green', 'Red', 'Green', 'Red', 'Silver']);
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

    it('should follow a fixedRows* change with no condition applied', () => {
      // Reading the list memoizes the pinned rows. Only `filter()` clears that memo, and with no
      // condition there is nothing to re-filter - so a later `fixedRows*` change would keep
      // answering from the set resolved on the first read.
      const filters = buildGrid({
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      expect(filters._getValueListDataAtColumn(2).map(({ value }) => value))
        .toEqual(['Green', 'Red', 'Green', 'Red', 'Silver']);

      hot.updateSettings({ fixedRowsTop: 0 });

      // Nothing is pinned now, so `Gold` belongs in the list again.
      expect(filters._getValueListDataAtColumn(2).map(({ value }) => value))
        .toEqual(['Gold', 'Green', 'Red', 'Green', 'Red', 'Silver']);
    });

    it('should exclude the same pinned row from both branches when another plugin trims a row', () => {
      // The two branches resolve pinned rows differently - one walks visual positions, the other
      // physical indexes - so under `trimRows` they used to disagree about WHICH row is pinned, and
      // a column's list changed the moment it got a condition of its own.
      //
      // They still read different row SOURCES by design (visible rows versus the whole column, so
      // a column's own filter cannot narrow its own list), which is why this asserts on the pinned
      // row alone. `Bronze` is unique to the row `trimRows` promotes into the top overlay.
      const filters = buildGrid({
        data: [
          ['Header', 25, 'Gold'],
          ['Banana', 20, 'Bronze'],
          ['Apple', 10, 'Red'],
          ['Date', 40, 'Green'],
          ['Cherry', 30, 'Red'],
          ['Total', 35, 'Silver'],
        ],
        trimRows: [0],
        fixedRowsBottom: 0,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      // No conditions: the visible-rows branch. Banana is the first row on screen, so it is pinned.
      expect(filters._getValueListDataAtColumn(2).map(({ value }) => value)).not.toContain('Bronze');

      // A condition switches the column to the whole-column branch, which must call the same row
      // pinned - not the row that merely sits first in the raw index order.
      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      expect(filters._getValueListDataAtColumn(2).map(({ value }) => value)).not.toContain('Bronze');
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
