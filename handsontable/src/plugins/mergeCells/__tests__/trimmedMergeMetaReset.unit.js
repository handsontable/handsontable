import Handsontable from 'handsontable';

/**
 * A merge whose rows are all trimmed stays in the merge list at the visual coordinates it had
 * before the trim. Dropping the merges used to reset the cell meta through those stale
 * coordinates, which address no row (or the wrong one) while the trim is active, and applying the
 * same settings again read them against the trimmed row space (DEV-3135).
 */
describe('MergeCells with trimmed or reordered rows', () => {
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

  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(6, 3),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  function filterOutEveryRow() {
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'by_value', [[]]);
    filters.filter();
  }

  function filterColumnC(keptValues) {
    const filters = hot.getPlugin('filters');

    // Column C sits outside every merge in these tests, so its values are never cleared by one.
    filters.addCondition(2, 'by_value', [keptValues]);
    filters.filter();
  }

  function clearFilters() {
    const filters = hot.getPlugin('filters');

    filters.clearConditions();
    filters.filter();
  }

  function mergeGeometry() {
    return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
  }

  function expectNoMergeMeta(rows, cols) {
    rows.forEach((row) => {
      cols.forEach((col) => {
        const meta = hot.getCellMeta(row, col);

        expect(meta.hidden).toBeUndefined();
        expect(meta.copyable).toBe(true);
        expect(meta.spanned).toBeUndefined();
        expect(meta.rowspan).toBeUndefined();
        expect(meta.colspan).toBeUndefined();
      });
    });
  }

  describe('dropping the merges', () => {
    it('should not throw when the merges are cleared while every row is filtered out', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      });

      filterOutEveryRow();

      expect(hot.countRows()).toBe(0);
      expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
    });

    it('should clear the merge meta when the plugin is disabled while every row is filtered out', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      });

      expect(hot.getCellMeta(1, 0).hidden).toBe(true);

      filterOutEveryRow();

      expect(() => hot.updateSettings({ mergeCells: false })).not.toThrow();

      clearFilters();

      expectNoMergeMeta([0, 1], [0]);
    });

    it('should fire the remove-meta hooks the same number of times as before for a plain merge', () => {
      let removeCount = 0;

      createGrid({
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
      });

      // Stores the span keys on the top-left cell, the way a render does.
      expect(hot.getCellMeta(0, 0).rowspan).toBe(3);

      hot.addHook('afterRemoveCellMeta', () => { removeCount += 1; });
      hot.updateSettings({ mergeCells: [] });

      // `hidden` and `copyable` on each of the 6 covered cells, and the 3 span keys on the top-left.
      expect(removeCount).toBe(15);
    });

    it('should clear the merge meta of the trimmed rows once they are visible again', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });

      // Stores the span keys on the top-left cell, the way a render does.
      expect(hot.getCellMeta(0, 0).rowspan).toBe(2);

      filterOutEveryRow();
      hot.updateSettings({ mergeCells: [] });
      clearFilters();

      expect(hot.countRows()).toBe(6);
      expectNoMergeMeta([0, 1], [0, 1]);
    });

    it('should not reset the meta of a foreign row that a trim slid onto the merge\'s stale position', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      });

      hot.setCellMeta(4, 0, 'copyable', false);

      // Keeps only physical rows 4 and 5, which now sit at the visual rows 0 and 1 the hidden merge
      // still names.
      filterColumnC(['C5', 'C6']);

      expect(hot.countRows()).toBe(2);

      hot.updateSettings({ mergeCells: [] });

      expect(hot.getCellMeta(0, 0).copyable).toBe(false);
    });

    it('should clear the merge meta of a partly trimmed merge, including its trimmed rows', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
      });

      // Stores the span keys on the original top-left cell.
      expect(hot.getCellMeta(0, 0).rowspan).toBe(3);

      // Trims physical row 0, the top row of the merge, so the merge now starts on physical row 1.
      filterColumnC(['C2', 'C3', 'C4', 'C5', 'C6']);

      expect(hot.countRows()).toBe(5);
      // Stores the span keys on the new, visible top-left cell as well.
      expect(hot.getCellMeta(0, 0).rowspan).toBe(2);

      hot.updateSettings({ mergeCells: [] });
      clearFilters();

      expect(hot.countRows()).toBe(6);
      expectNoMergeMeta([0, 1, 2], [0, 1]);
    });
  });

  describe('sending the same merges again', () => {
    // The React and Angular wrappers send unchanged settings again on every commit.

    it('should keep the merge when it is sent again while every row is filtered out', () => {
      const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 1 }];
      const warnSpy = spyOn(console, 'warn');

      createGrid({ filters: true, mergeCells });
      filterOutEveryRow();

      expect(() => hot.updateSettings({ mergeCells })).not.toThrow();

      clearFilters();

      expect(mergeGeometry()).toEqual([[0, 0, 2, 1]]);
      expect(hot.getCellMeta(0, 0).rowspan).toBe(2);
      expect(hot.getCellMeta(1, 0).hidden).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should keep a merge whose area reaches past the rows a filter leaves visible', () => {
      const mergeCells = [{ row: 3, col: 0, rowspan: 2, colspan: 1 }];
      const warnSpy = spyOn(console, 'warn');

      createGrid({ filters: true, mergeCells });
      // Keeps physical rows 0 to 2 only, so the area's rows 3 and 4 do not exist in the view.
      filterColumnC(['C1', 'C2', 'C3']);

      hot.updateSettings({ mergeCells });
      clearFilters();

      expect(mergeGeometry()).toEqual([[3, 0, 2, 1]]);
      expect(hot.getCellMeta(4, 0).hidden).toBe(true);
      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', null, 'A6']);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should apply an area that fits the visible rows to those rows, as before', () => {
      // An application that computes its merges from the rows on screen sends the same areas after
      // filtering, and they must land on the rows it now shows.
      const mergeCells = [
        { row: 0, col: 0, rowspan: 2, colspan: 1 },
        { row: 2, col: 0, rowspan: 2, colspan: 1 },
      ];

      createGrid({ filters: true, mergeCells });
      // Trims physical rows 0 and 1.
      filterColumnC(['C3', 'C4', 'C5', 'C6']);

      hot.updateSettings({ mergeCells });

      expect(hot.getCellMeta(0, 0).rowspan).toBe(2);
      expect(hot.getCellMeta(1, 0).hidden).toBe(true);
      expect(hot.getCellMeta(2, 0).rowspan).toBe(2);
      expect(hot.getCellMeta(3, 0).hidden).toBe(true);
    });

    it('should not let a kept merge whose rows are all filtered out block a new area', () => {
      const kept = { row: 2, col: 0, rowspan: 2, colspan: 1 };
      const warnSpy = spyOn(console, 'warn');
      const filters = () => hot.getPlugin('filters');

      createGrid({ filters: true, mergeCells: [kept] });
      // Draws the merge at the visual rows 0 and 1...
      filterColumnC(['C3', 'C4', 'C5', 'C6']);
      // ...then trims both of its rows in one step, which leaves it purged with those coordinates.
      filters().removeConditions(2);
      filters().addCondition(2, 'by_value', [['C5', 'C6']]);
      filters().filter();

      hot.updateSettings({ mergeCells: [kept, { row: 0, col: 0, rowspan: 2, colspan: 1 }] });
      clearFilters();

      expect(mergeGeometry().sort((a, b) => a[0] - b[0])).toEqual([[2, 0, 2, 1], [4, 0, 2, 1]]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not keep a merge that a row insert moved off the area it was created from', () => {
      const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 1 }];

      createGrid({ filters: true, mergeCells });
      hot.alter('insert_row_above', 0);

      expect(mergeGeometry()).toEqual([[1, 0, 2, 1]]);

      spyOn(console, 'warn');
      filterOutEveryRow();
      hot.updateSettings({ mergeCells });
      clearFilters();

      // The area no longer describes the merge, so it is applied like any other area: it does not
      // fit an empty view, and the merge at rows 1 and 2 is not kept either.
      expect(mergeGeometry()).toEqual([]);
    });

    it('should not run the merge hooks or write any data for a merge it keeps', () => {
      const mergeCells = [{ row: 0, col: 0, rowspan: 3, colspan: 1 }];
      const calls = [];

      createGrid({ filters: true, mergeCells });
      filterOutEveryRow();

      ['afterMergeCells', 'beforeChange', 'afterRemoveCellMeta'].forEach((hookName) => {
        hot.addHook(hookName, () => calls.push(hookName));
      });

      hot.updateSettings({ mergeCells });

      expect(calls).toEqual([]);
    });

    it('should drop a merge the new settings no longer declare and apply a new one as before', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      });
      // Trims physical row 5, below every merge in this test.
      filterColumnC(['C1', 'C2', 'C3', 'C4', 'C5']);

      hot.updateSettings({ mergeCells: [{ row: 2, col: 1, rowspan: 2, colspan: 1 }] });
      clearFilters();

      expect(mergeGeometry()).toEqual([[2, 1, 2, 1]]);
      expect(hot.getCellMeta(1, 0).hidden).toBeUndefined();
      expect(hot.getCellMeta(3, 1).hidden).toBe(true);
    });
  });

  describe('unmerging', () => {
    it('should clear the merge meta of a partly trimmed merge, including its trimmed rows', () => {
      createGrid({
        filters: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
      });

      expect(hot.getCellMeta(0, 0).rowspan).toBe(3);

      filterColumnC(['C2', 'C3', 'C4', 'C5', 'C6']);

      expect(hot.getCellMeta(0, 0).rowspan).toBe(2);

      hot.getPlugin('mergeCells').unmerge(0, 0, 1, 1);
      clearFilters();

      expect(mergeGeometry()).toEqual([]);
      expectNoMergeMeta([0, 1, 2], [0, 1]);
    });
  });

  describe('a sorted grid', () => {
    // After the sort, the merge's physical row 1 sits at the visual row 3, while the block the merge
    // draws (visual rows 0 and 1) covers physical row 2, which belongs to another record.
    function createSortedGrid() {
      createGrid({
        data: [[1, 'a'], [4, 'b'], [2, 'c'], [3, 'd'], [5, 'e'], [6, 'f']],
        columnSorting: true,
        trimRows: true,
        mergeCells: [{ row: 0, col: 1, rowspan: 2, colspan: 1 }],
      });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      // Stores the covered-cell keys on the foreign row, the way a render does.
      expect(hot.getCellMeta(1, 1).hidden).toBe(true);
    }

    it('should clear the merge meta of every row the merge drew when the merges are cleared', () => {
      createSortedGrid();

      hot.updateSettings({ mergeCells: [] });

      expectNoMergeMeta([0, 1, 3], [1]);
    });

    it('should clear the merge meta of every row the merge drew when it is unmerged', () => {
      createSortedGrid();

      hot.getPlugin('mergeCells').unmerge(0, 1, 1, 1);

      expectNoMergeMeta([0, 1, 3], [1]);
    });

    it('should clear the merge meta of a row the merge drew once a trim hides all of its own rows', () => {
      createSortedGrid();

      hot.getPlugin('trimRows').trimRows([0, 1]);
      hot.updateSettings({ mergeCells: [] });
      hot.getPlugin('trimRows').untrimAll();

      // Physical row 2, the record the merge drew over, sits at the visual row 1 again.
      expectNoMergeMeta([0, 1, 3], [1]);
    });
  });

  describe('with SheetsBar', () => {
    it('should not bring the merge meta back once the filtered rows are visible again', () => {
      createGrid({
        filters: true,
        sheetsBar: true,
        mergeCells: true,
      });

      hot.getPlugin('mergeCells').merge(0, 0, 1, 0);
      filterOutEveryRow();
      hot.updateSettings({ mergeCells: [] });
      clearFilters();

      expect(hot.countRows()).toBe(6);
      expectNoMergeMeta([0, 1], [0]);
    });
  });
});
