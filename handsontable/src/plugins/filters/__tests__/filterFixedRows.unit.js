import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { NestedRows } from 'handsontable/plugins/nestedRows';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(TrimRows);
registerPlugin(ColumnSorting);
registerPlugin(NestedRows);
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

    it('should re-apply the exemption after the frozen footer is removed', () => {
      // Removing the frozen footer makes `alter()` lower `fixedRowsBottom` to 0, AFTER
      // `afterRemoveRow` has run. So `Date` (Green, already trimmed) is not promoted into the frozen
      // pane - it stays trimmed, and the exemption must use the lowered count. A pass run inside
      // `afterRemoveRow` saw the old count, kept `Date` on screen, and skewed Core's own
      // bookkeeping so that `fixedRowsBottom` stayed 1.
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

      expect(hot.getSettings().fixedRowsBottom).toBe(0);
      expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);
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

    it('should not re-apply the exemption when the option is off', () => {
      // The re-apply is gated so a grid that never opted in pays nothing. With the default, an
      // `updateSettings` carrying `fixedRows*` must leave the filtered result exactly as it was.
      const filters = buildGrid().getPlugin('filters');

      filters.addCondition(2, 'eq', ['Red']);
      filters.filter();

      const writeSpy = jest.spyOn(filters.filtersRowsMap, 'setValues');

      hot.updateSettings({ fixedRowsBottom: 0 });

      expect(writeSpy).not.toHaveBeenCalled();
      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry']);

      writeSpy.mockRestore();
    });

    it('should not re-apply the exemption when the option is on but nothing is filtered', () => {
      const filters = buildGrid({ filters: { filterFixedRows: false } }).getPlugin('filters');
      const writeSpy = jest.spyOn(filters.filtersRowsMap, 'setValues');

      hot.updateSettings({ fixedRowsBottom: 0 });

      expect(writeSpy).not.toHaveBeenCalled();

      writeSpy.mockRestore();
    });

    // DEV-2941: a change only MARKS the exemption as possibly stale; the next full render re-applies
    // it once, quietly, and only when the frozen rows differ from the ones the last pass exempted.
    // Each test counts the trimming-map writes AND checks the rows, so a skip that should not happen
    // shows up as a stale row, and a write that should not happen shows up in the count.
    describe('re-applying the exemption after the rows change', () => {
      let writeSpy;
      let afterFilterSpy;

      afterEach(() => {
        writeSpy?.mockRestore();
        writeSpy = null;
        afterFilterSpy = null;
      });

      /**
       * Builds an opted-in grid filtered to the `Red` rows, then starts counting trimming-map writes
       * and `afterFilter` calls.
       *
       * @param {object} [overrides] Settings merged over the defaults.
       * @returns {object} The Filters plugin.
       */
      function buildFilteredGrid(overrides = {}) {
        const filters = buildGrid({ filters: { filterFixedRows: false }, ...overrides }).getPlugin('filters');

        filters.addCondition(2, 'eq', ['Red']);
        filters.filter();

        writeSpy = jest.spyOn(filters.filtersRowsMap, 'setValues');
        afterFilterSpy = jest.fn();
        hot.addHook('afterFilter', afterFilterSpy);

        return filters;
      }

      it('should not re-apply on a sort that leaves the frozen rows in place', () => {
        // Under the default `sortFixedRows` the sorting plugin holds the frozen rows in place. A sort
        // fires `afterRowSequenceChange` twice, and each firing used to cost a full filter pass.
        buildFilteredGrid({ columnSorting: true });

        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

        expect(writeSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Cherry', 'Apple', 'Total']);
      });

      it('should re-apply once, quietly, on a sort that changes the frozen rows', () => {
        buildFilteredGrid({ columnSorting: { sortFixedRows: true } });

        // Descending by Fruit puts `Total` first and `Apple` last, so `Header` (Gold) stops being
        // exempt and the `Red` condition reaches it.
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(afterFilterSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['Total', 'Cherry', 'Apple']);
      });

      it('should re-apply once when re-sorting an already sorted grid', () => {
        // A re-sort first restores the unsorted order and then applies the new one, which fires the
        // sequence hook on an intermediate order. Only the final order may be applied.
        buildFilteredGrid({ columnSorting: { sortFixedRows: true } });

        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        writeSpy.mockClear();

        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

        expect(writeSpy).toHaveBeenCalledTimes(1);
        // The sort orders only the rows the filter shows; trimmed rows keep their unsorted slots.
        // The row order is the identity again, so `Header` (physical 0) is the top frozen row.
        expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
      });

      it('should not re-apply on a row move that stays outside the frozen rows', () => {
        buildFilteredGrid();

        // Visual rows are `Header, Apple, Cherry, Total`; this swaps the two middle ones. A move
        // through the index mapper does not render by itself, which is when the check runs.
        hot.rowIndexMapper.moveIndexes([2], 1);
        hot.render();

        expect(writeSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Cherry', 'Apple', 'Total']);
      });

      it('should re-apply on a row move into the frozen rows', () => {
        buildFilteredGrid();

        // `Apple` becomes the top frozen row, so `Header` (Gold) stops being exempt.
        hot.rowIndexMapper.moveIndexes([1], 0);
        hot.render();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Total']);
      });

      it('should re-apply after a move made from an afterFilter listener', () => {
        // `filter()` renders while its own pass is still open, and the pass memoizes the pinned rows
        // in the very set it records as applied. Comparing through that memo reads "unchanged" for
        // any move made from `afterFilter`, so the check must resolve the rows afresh.
        const filters = buildFilteredGrid();
        let hasMoved = false;

        hot.addHook('afterFilter', () => {
          if (!hasMoved) {
            hasMoved = true;
            hot.rowIndexMapper.moveIndexes([1], 0);
          }
        });

        filters.filter();

        expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Total']);
      });

      it('should keep a queued re-apply when beforeFilter vetoes the filter', () => {
        // A vetoed `filter()` leaves the trimming map as it was, so it has not answered a check that
        // a row change queued before it. The next full render must still run that check.
        const filters = buildFilteredGrid();

        hot.rowIndexMapper.moveIndexes([1], 0);
        hot.addHook('beforeFilter', () => false);
        filters.filter();
        hot.render();

        // `Apple` is the top frozen row now, so `Header` (Gold) stops being exempt.
        expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Total']);
      });

      it('should re-apply on an insert even when the pinned row NUMBERS did not change', () => {
        // With only a top frozen row, the pinned set is `{0}` before AND after `insert_row_above`
        // at 0 - but physical row 0 is now the new row, and `Header` has moved to physical 1. A
        // set comparison would call that unchanged and leave `Header` on screen.
        buildFilteredGrid({ fixedRowsBottom: 0 });

        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry']);

        hot.alter('insert_row_above', 0);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(afterFilterSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual([null, 'Apple', 'Cherry']);
      });

      it('should re-apply inside a batch once the batch renders', () => {
        buildFilteredGrid({ fixedRowsBottom: 0 });

        hot.batch(() => {
          hot.alter('insert_row_above', 0);
        });

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(hot.getDataAtCol(0)).toEqual([null, 'Apple', 'Cherry']);
      });

      it('should keep the selection where it was when an insert re-applies the exemption', () => {
        // A background pass used to go through `filter()`, which re-selects the first row of the
        // selected column - so an insert anywhere moved the user's selection to the top.
        buildFilteredGrid();
        hot.selectCell(2, 1);

        // Visual rows are `Header, Apple, Cherry, Total`; the new row lands above `Total`.
        hot.alter('insert_row_above', 3);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);
        expect(hot.getDataAtCell(2, 0)).toBe('Cherry');
      });

      it('should drop the selection when the quiet pass trims the selected row', () => {
        // The pass runs from inside a render and trims `Header`, which is selected. The Core drops a
        // stranded selection rather than sliding it onto a neighbor (see `handsontable/AGENTS.md`).
        buildFilteredGrid({ fixedRowsBottom: 0 });
        hot.selectCell(0, 0);

        expect(() => hot.alter('insert_row_above', 0)).not.toThrow();
        expect(hot.getDataAtCol(0)).toEqual([null, 'Apple', 'Cherry']);
        expect(hot.getSelectedLast()).toBeUndefined();
      });

      it('should follow the lowered fixedRowsTop after the top frozen row is removed', () => {
        // `alter()` lowers `fixedRowsTop` to 0 after `afterRemoveRow`, so nothing is frozen any more
        // and `Banana` (Green) must stay trimmed.
        buildFilteredGrid({ fixedRowsBottom: 0 });

        hot.alter('remove_row', 0);

        expect(hot.getSettings().fixedRowsTop).toBe(0);
        expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry']);
      });

      it('should re-apply after updateData() shrinks the data', () => {
        // `updateData()` resizes through `fitToLength()`, which raises no `afterRemoveRow` - the same
        // path a NestedRows resize takes. `Date` (Green) becomes the bottom frozen row.
        buildFilteredGrid();

        hot.updateData(DATA.slice(0, 4).map(row => row.slice()));

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Date']);
      });

      it('should re-apply after turning NestedRows off shrinks the rows', () => {
        // The toggle resizes through `fitToLength()` and raises no row hook of any kind. The
        // flattened tree is `Header, Apple, Banana, Date, Cherry, Total`; turned off, the grid holds
        // the four top-level rows, and the trimming map keeps the first four states of the tree -
        // which would show `Date` (Green) and hide `Cherry` (Red) and the frozen `Total`.
        hot = new Handsontable(container, {
          data: [
            {
              name: 'Header',
              color: 'Gold',
              __children: [{ name: 'Apple', color: 'Red' }, { name: 'Banana', color: 'Green' }],
            },
            { name: 'Date', color: 'Green' },
            { name: 'Cherry', color: 'Red' },
            { name: 'Total', color: 'Silver' },
          ],
          columns: [{ data: 'name' }, { data: 'color' }],
          nestedRows: true,
          filters: { filterFixedRows: false },
          fixedRowsTop: 1,
          fixedRowsBottom: 1,
          licenseKey: 'non-commercial-and-evaluation',
        });

        const filters = hot.getPlugin('filters');

        filters.addCondition(1, 'eq', ['Red']);
        filters.filter();
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

        hot.updateSettings({ nestedRows: false });

        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Cherry', 'Total']);
      });

      it('should not re-apply after a same-size updateData()', () => {
        buildFilteredGrid();

        hot.updateData(DATA.map(row => row.slice()));

        expect(writeSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
      });

      it('should not re-apply when fixedRows* is restated with the same value', () => {
        // Wrappers re-send unchanged settings on every update.
        buildFilteredGrid();

        hot.updateSettings({ fixedRowsTop: 1, fixedRowsBottom: 1 });

        expect(writeSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);
      });
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
