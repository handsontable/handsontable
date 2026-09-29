import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  ColumnSummary,
  Formulas,
  ManualColumnMove,
  ManualRowMove,
  TrimRows,
  UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);
registerPlugin(Formulas);
registerPlugin(ManualColumnMove);
registerPlugin(ManualRowMove);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);

/**
 * DEV-145: the endpoint coordinates (`sourceColumn`, `destinationColumn`, `destinationRow`, `ranges`) are
 * documented as PHYSICAL indexes, so a summary follows its column and keeps summing the same records when
 * columns or rows are moved.
 *
 * Before the fix the columns were used as visual indexes and never remapped, while the result value and its
 * meta (both physical-keyed) travelled with the column. Editing the moved column then left its summary stale,
 * and editing the column that moved into the old position wrote a second summary there. On the row axis, every
 * move re-read the already-physical ranges as visual ones, so the second move onwards corrupted them.
 */
describe('ColumnSummary with moved columns and rows', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
  });

  /**
   * Creates a grid with the license key every test grid needs.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable} The created instance.
   */
  function createGrid(settings) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
  }

  /**
   * Returns the visual columns of a row whose cell carries the summary result class.
   *
   * @param {number} row Visual row index.
   * @returns {number[]}
   */
  function summaryColumnsInRow(row) {
    const columns = [];

    for (let column = 0; column < hot.countCols(); column++) {
      if ((hot.getCellMeta(row, column).className || '').includes('columnSummaryResult')) {
        columns.push(column);
      }
    }

    return columns;
  }

  /**
   * The reporter's grid: one reversed `sum` summary on the last row of column A.
   *
   * @param {object} [extraSettings] Settings to merge in.
   * @returns {Handsontable} The created instance.
   */
  function createReportedGrid(extraSettings = {}) {
    return createGrid({
      data: [[3, 6, 9], [2, 7, 6], [5, 3, 4], [null, null, null]],
      manualColumnMove: true,
      columnSummary: [{ destinationRow: 0, destinationColumn: 0, reversedRowCoords: true, type: 'sum' }],
      ...extraSettings,
    });
  }

  describe('column move', () => {
    it('recalculates the moved column\'s summary and writes no second summary (reported steps)', () => {
      hot = createReportedGrid();

      // Step 1: an edit before any move works.
      hot.setDataAtCell(0, 0, 2);

      expect(hot.getDataAtCell(3, 0)).toBe(9);

      // Step 2: move column A after column B. The result travels with its column.
      hot.getPlugin('manualColumnMove').moveColumn(0, 1);

      expect(hot.getDataAtCol(1)).toEqual([2, 2, 5, 9]);

      // Step 3: editing the moved column (now B) must update its summary. It stayed at 9 before the fix.
      hot.setDataAtCell(0, 1, 3);

      expect(hot.getDataAtCell(3, 1)).toBe(10);

      // Step 4: editing the column that moved into A's old place must not write a summary there. Before the fix
      // A4 received 11 (the sum of that other column) and the grid showed two summaries.
      hot.setDataAtCell(0, 0, 1);

      expect(hot.getDataAtCell(3, 0)).toBe(null);
      expect(hot.getDataAtCell(3, 1)).toBe(10);
      expect(summaryColumnsInRow(3)).toEqual([1]);
    });

    it('keeps the result, its read-only state and its class on the moved column without an edit', () => {
      // The value and the meta are physical-keyed, so they travel with the column on their own. This pins that
      // the plugin needs no column-move hook for that - and must not add one that rewrites the result.
      hot = createReportedGrid();

      expect(hot.getDataAtCell(3, 0)).toBe(10);

      hot.getPlugin('manualColumnMove').moveColumn(0, 2);

      expect(hot.getDataAtCell(3, 2)).toBe(10);
      expect(hot.getCellMeta(3, 2).readOnly).toBe(true);
      expect(summaryColumnsInRow(3)).toEqual([2]);
      // The cell that took the old position is ordinary data again.
      expect(hot.getCellMeta(3, 0).readOnly).toBe(false);
    });

    it('follows the column through an undo and a redo of the move', () => {
      hot = createReportedGrid({ undo: true });

      hot.getPlugin('manualColumnMove').moveColumn(0, 2);

      // Premise: the move really happened.
      expect(hot.getDataAtCell(3, 2)).toBe(10);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getDataAtCell(3, 0)).toBe(10);
      expect(summaryColumnsInRow(3)).toEqual([0]);

      hot.getPlugin('undoRedo').redo();
      hot.setDataAtCell(0, 2, 13);

      expect(hot.getDataAtCell(3, 2)).toBe(20);
      expect(summaryColumnsInRow(3)).toEqual([2]);
    });

    it('tracks a source column and a destination column that are moved separately', () => {
      hot = createGrid({
        data: [[null, 1, 100], [null, 2, 200], [null, 3, 300], [null, null, null]],
        manualColumnMove: true,
        columnSummary: [{ destinationRow: 3, destinationColumn: 0, sourceColumn: 2, ranges: [[0, 2]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(3, 0)).toBe(600);

      // Move the SOURCE column to the front: physical 2 is now visual 0, the destination is visual 1.
      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      expect(hot.getDataAtCell(3, 1)).toBe(600);

      hot.setDataAtCell(0, 0, 150);

      expect(hot.getDataAtCell(3, 1)).toBe(650);

      // Editing the column that now sits where the source used to be must not affect the summary.
      hot.setDataAtCell(0, 2, 50);

      expect(hot.getDataAtCell(3, 1)).toBe(650);
      expect(summaryColumnsInRow(3)).toEqual([1]);
    });

    it('keeps following the column across a column insert and a column removal after a move', () => {
      hot = createReportedGrid();

      // Physical order becomes [1, 2, 0]: the summary column (physical 0) is the last visual column.
      hot.getPlugin('manualColumnMove').moveColumn(0, 2);

      expect(hot.getDataAtCell(3, 2)).toBe(10);

      // Insert before visual 0. The new column takes physical index 1, so physical 0 must NOT shift - comparing
      // the physical destination against the visual index shifted it onto another column before the fix.
      hot.alter('insert_col_start', 0);

      expect(summaryColumnsInRow(3)).toEqual([3]);
      expect(hot.getDataAtCell(3, 3)).toBe(10);

      hot.setDataAtCell(0, 3, 13);

      expect(hot.getDataAtCell(3, 3)).toBe(20);

      // Remove the inserted column again.
      hot.alter('remove_col', 0);

      expect(summaryColumnsInRow(3)).toEqual([2]);

      hot.setDataAtCell(1, 2, 12);

      expect(hot.getDataAtCell(3, 2)).toBe(30);
    });

    it('treats the coordinates returned by a settings function as physical', () => {
      hot = createGrid({
        data: [[3, 6, 9], [2, 7, 6], [5, 3, 4], [null, null, null]],
        manualColumnMove: true,
        columnSummary() {
          return [{ destinationRow: 3, destinationColumn: 0, ranges: [[0, 2]], type: 'sum' }];
        },
      });

      expect(hot.getDataAtCell(3, 0)).toBe(10);

      hot.getPlugin('manualColumnMove').moveColumn(0, 1);
      hot.setDataAtCell(0, 1, 13);

      expect(hot.getDataAtCell(3, 1)).toBe(20);

      hot.setDataAtCell(0, 0, 1);

      expect(hot.getDataAtCell(3, 0)).toBe(null);
      expect(summaryColumnsInRow(3)).toEqual([1]);
    });

    it('reads a trimmed row of a moved column from that column', () => {
      hot = createGrid({
        data: [[1, 100], [2, 200], [3, 300], [null, null]],
        manualColumnMove: true,
        trimRows: [1],
        columnSummary: [{ destinationRow: 3, destinationColumn: 0, ranges: [[0, 2]], type: 'sum' }],
      });

      // Physical row 1 is trimmed, yet it is part of the physical range and still counts: 1 + 2 + 3.
      expect(hot.getDataAtCell(2, 0)).toBe(6);

      hot.getPlugin('manualColumnMove').moveColumn(0, 1);
      hot.setDataAtCell(0, 1, 11);

      // The trimmed row is read through `getSourceDataAtCell`, which takes a VISUAL column. Passing the physical
      // column there read the other column's 200 after the move.
      expect(hot.getDataAtCell(2, 1)).toBe(16);
    });
  });

  describe('column order and cell meta', () => {
    it('reads the configured coordinates as physical when the grid starts with a column order', () => {
      // Physical order [2, 0, 1]: physical column 0 is shown as visual column 1.
      hot = createReportedGrid({ manualColumnMove: [2, 0, 1] });

      expect(hot.getDataAtCell(3, 1)).toBe(10);
      expect(summaryColumnsInRow(3)).toEqual([1]);

      hot.setDataAtCell(0, 1, 13);

      expect(hot.getDataAtCell(3, 1)).toBe(20);
    });

    it('re-applies the result styling on the moved column after `updateSettings({ columns })`', () => {
      hot = createReportedGrid();

      // `columns` resets the cell metas, and a column order passed along keeps physical column 0 at visual 2.
      hot.updateSettings({ columns: [{}, {}, {}], manualColumnMove: [1, 2, 0] });

      expect(hot.toVisualColumn(0)).toBe(2);
      expect(summaryColumnsInRow(3)).toEqual([2]);
      expect(hot.getCellMeta(3, 2).readOnly).toBe(true);
      expect(hot.getCellMeta(3, 0).readOnly).toBe(false);
    });

    it('de-summarizes the vacated cell of a moved column when a reversed summary follows a row append', () => {
      hot = createReportedGrid();

      hot.getPlugin('manualColumnMove').moveColumn(0, 2);
      hot.alter('insert_row_below', 3);

      // The reversed summary moved down onto the new last row, in the column it belongs to.
      expect(hot.getDataAtCell(4, 2)).toBe(10);
      expect(summaryColumnsInRow(4)).toEqual([2]);
      // The vacated cell is ordinary data again. Before the fix the styling was dropped from visual column 0.
      expect(summaryColumnsInRow(3)).toEqual([]);
      expect(hot.getCellMeta(3, 2).readOnly).toBe(false);
    });

    it('keeps following the column when a column is inserted after it with `insert_col_end`', () => {
      hot = createReportedGrid();

      // Physical order [1, 2, 0], then a new column right after physical column 0.
      hot.getPlugin('manualColumnMove').moveColumn(0, 2);
      hot.alter('insert_col_end', 2);

      expect(summaryColumnsInRow(3)).toEqual([2]);

      hot.setDataAtCell(0, 2, 13);

      expect(hot.getDataAtCell(3, 2)).toBe(20);
    });

    it('refreshes a summary of formula results when a referenced column is edited after a move', () => {
      hot = createGrid({
        data: [[1, 10, '=A1+B1'], [2, 20, '=A2+B2'], [3, 30, '=A3+B3'], [null, null, null]],
        formulas: { engine: HyperFormula },
        manualColumnMove: true,
        columnSummary: [{ destinationRow: 3, destinationColumn: 2, ranges: [[0, 2]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(3, 2)).toBe(66);

      // Move the formula column to the front, then edit column A (physical 0, now visual 1). Only the formula
      // engine's update can refresh the summary: the edited column is not the summary's source column.
      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      expect(hot.getDataAtCell(3, 0)).toBe(66);

      hot.setDataAtCell(0, 1, 5);

      expect(hot.getDataAtCell(0, 0)).toBe(15);
      expect(hot.getDataAtCell(3, 0)).toBe(70);
    });
  });

  describe('row move', () => {
    /**
     * Four data rows summed into the last row.
     *
     * @param {object} [endpoint] Endpoint settings to merge in.
     * @returns {Handsontable} The created instance.
     */
    function createRowGrid(endpoint = {}) {
      return createGrid({
        data: [[1], [2], [3], [4], [null]],
        manualRowMove: true,
        columnSummary: [{ destinationRow: 4, destinationColumn: 0, ranges: [[0, 3]], type: 'sum', ...endpoint }],
      });
    }

    /**
     * Returns the value of the only summary cell in the column, wherever the moves and alterations put it.
     *
     * @returns {*}
     */
    function summaryValue() {
      const rows = [];

      for (let row = 0; row < hot.countRows(); row++) {
        if ((hot.getCellMeta(row, 0).className || '').includes('columnSummaryResult')) {
          rows.push(row);
        }
      }

      expect(rows.length).toBe(1);

      return hot.getDataAtCell(rows[0], 0);
    }

    it('keeps the range when the same row is moved twice', () => {
      hot = createRowGrid();

      hot.getPlugin('manualRowMove').moveRow(1, 0);
      hot.getPlugin('manualRowMove').moveRow(1, 0);

      // The two moves restore the identity order. The second one used to drop physical row 1 from the range.
      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 10]);

      hot.setDataAtCell(0, 0, 5);

      expect(hot.getDataAtCell(4, 0)).toBe(14);
      expect(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges).toEqual([[0, 3]]);
    });

    it('keeps summing the same records across any sequence of moves', () => {
      const sequences = [
        [[2, 3], [3, 0], [1, 3]],
        [[0, 0], [1, 0], [2, 0], [2, 0]],
        [[3, 0], [0, 2], [1, 3], [2, 1]],
        [[4, 0], [2, 4], [0, 3]],
        [[1, 4], [4, 1], [0, 2]],
      ];

      sequences.forEach((sequence) => {
        hot = createRowGrid();

        sequence.forEach(([row, finalIndex]) => hot.getPlugin('manualRowMove').moveRow(row, finalIndex));

        // Edit the record that holds physical row 0, wherever it is shown.
        hot.setDataAtCell(hot.toVisualRow(0), 0, 10);

        expect(summaryValue()).toBe(10 + 2 + 3 + 4);

        hot.destroy();
        hot = null;
      });
    });

    it('keeps counting a row moved below the summary row', () => {
      hot = createRowGrid();

      hot.getPlugin('manualRowMove').moveRow(0, 4);

      // Premise: physical row 0 now sits under the summary.
      expect(hot.getDataAtCol(0)).toEqual([2, 3, 4, 10, 1]);

      hot.setDataAtCell(4, 0, 6);

      expect(hot.getDataAtCell(3, 0)).toBe(15);
    });

    it('does not count a row moved into the range from outside it', () => {
      hot = createGrid({
        data: [[1], [2], [3], [null], [100]],
        manualRowMove: true,
        columnSummary: [{ destinationRow: 3, destinationColumn: 0, ranges: [[0, 2]], type: 'sum' }],
      });

      hot.getPlugin('manualRowMove').moveRow(4, 0);
      hot.setDataAtCell(1, 0, 11);

      expect(hot.getDataAtCell(4, 0)).toBe(16);
    });

    it('follows the summary row when it is moved to the top after a data row move', () => {
      hot = createRowGrid();

      // Physical order [1, 0, 2, 3, 4], then the summary row to the top: [4, 1, 0, 2, 3].
      hot.getPlugin('manualRowMove').moveRow(1, 0);
      hot.getPlugin('manualRowMove').moveRow(4, 0);

      expect(hot.getDataAtCol(0)).toEqual([10, 2, 1, 3, 4]);
      expect(summaryColumnsInRow(0)).toEqual([0]);

      hot.setDataAtCell(1, 0, 102);

      expect(hot.getDataAtCell(0, 0)).toBe(110);
    });

    it('does not recalculate when a move leaves the order unchanged', () => {
      const customFunction = jest.fn(() => 0);

      hot = createRowGrid({ type: 'custom', customFunction });

      const callsBeforeMove = customFunction.mock.calls.length;

      hot.getPlugin('manualRowMove').moveRow(0, 0);

      expect(customFunction.mock.calls.length).toBe(callsBeforeMove);

      hot.getPlugin('manualRowMove').moveRow(0, 2);

      expect(customFunction.mock.calls.length).toBe(callsBeforeMove + 1);
    });

    it('shifts the range in the physical space when several rows are removed after a move', () => {
      hot = createGrid({
        data: [[1], [2], [3], [4], [5], [null]],
        manualRowMove: true,
        columnSummary: [{ destinationRow: 5, destinationColumn: 0, ranges: [[2, 4]], type: 'sum' }],
      });

      expect(summaryValue()).toBe(12);

      // Physical order [1, 2, 3, 4, 0, 5]. Visual rows 3-4 are physical rows 4 (inside the range) and 0
      // (before it). Comparing the range against the visual index 3 shifted the bounds wrongly.
      hot.getPlugin('manualRowMove').moveRow(0, 4);
      hot.alter('remove_row', 3, 2);

      // The range keeps the surviving records 3 and 4.
      expect(summaryValue()).toBe(7);

      hot.setDataAtCell(hot.toVisualRow(1), 0, 10);

      expect(summaryValue()).toBe(14);
    });

    it('shifts the range in the physical space when a row is inserted after a move', () => {
      hot = createRowGrid();

      // Physical order becomes [1, 2, 3, 4, 0].
      hot.getPlugin('manualRowMove').moveRow(0, 4);

      // Insert above visual 0. The new row takes physical index 1, so physical row 0 stays in the range -
      // comparing the physical range against the visual index shifted it out before the fix.
      hot.alter('insert_row_above', 0);

      expect(summaryValue()).toBe(10);

      hot.setDataAtCell(hot.toVisualRow(0), 0, 11);

      expect(summaryValue()).toBe(20);
    });
  });

  describe('structure alteration without a move', () => {
    it('moves a removed range start onto the next row, not the previous record', () => {
      hot = createGrid({
        data: [[1, 10], [2, 20], [3, 30], [4, 40], [null, null]],
        columnSummary: [{ sourceColumn: 1, destinationRow: 4, destinationColumn: 1, ranges: [[1, 3]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(4, 1)).toBe(90);

      hot.alter('remove_row', 1, 1);

      // The range covered records 20, 30 and 40; 20 was removed. It used to become [[0, 2]] and pull in 10.
      expect(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges).toEqual([[1, 2]]);
      expect(hot.getDataAtCell(3, 1)).toBe(70);
    });

    it('drops a single-row range whose row is removed instead of summing another record', () => {
      hot = createGrid({
        data: [[1], [2], [3], [4], [null]],
        columnSummary: [{ destinationRow: 4, destinationColumn: 0, ranges: [[0], [2]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(4, 0)).toBe(4);

      hot.alter('remove_row', 2, 1);

      // `[2]` used to become `[1]` and count the record 2 instead.
      expect(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges).toEqual([[0]]);
      expect(hot.getDataAtCell(3, 0)).toBe(1);
    });

    it('drops a range whose rows are all removed', () => {
      hot = createGrid({
        data: [[1], [2], [3], [4], [null]],
        columnSummary: [{ destinationRow: 4, destinationColumn: 0, ranges: [[0, 0], [1, 2]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(4, 0)).toBe(6);

      hot.alter('remove_row', 1, 2);

      expect(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges).toEqual([[0, 0]]);
      expect(hot.getDataAtCell(2, 0)).toBe(1);
    });

    it('grows a range below a summary placed above it when a row is inserted inside the range', () => {
      hot = createGrid({
        data: [[null], [1], [2], [3]],
        columnSummary: [{ destinationRow: 0, destinationColumn: 0, ranges: [[1, 3]], type: 'sum' }],
      });

      expect(hot.getDataAtCell(0, 0)).toBe(6);

      hot.alter('insert_row_above', 2);
      hot.setDataAtCell(4, 0, 30);

      // The range bounds are shifted on their own: the last data row is still covered. It used to shift only
      // together with the destination, so an insertion below the summary left the last row out.
      expect(hot.getDataAtCell(0, 0)).toBe(33);
    });
  });
});
