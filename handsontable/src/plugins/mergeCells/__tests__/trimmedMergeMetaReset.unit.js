import Handsontable from 'handsontable';

/**
 * A merge whose rows are all trimmed stays in the merge list at the visual coordinates it had
 * before the trim. Dropping the merges then used to reset the cell meta through those stale
 * coordinates, which address no row (or the wrong one) while the trim is active (DEV-3135).
 */
describe('MergeCells resets the meta of merges whose rows are trimmed', () => {
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

  it('should not throw when the merges are cleared while every row is filtered out', () => {
    createGrid({
      filters: true,
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
    });

    filterOutEveryRow();

    expect(hot.countRows()).toBe(0);
    expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
  });

  it('should not throw when the plugin is disabled while every row is filtered out', () => {
    createGrid({
      filters: true,
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
    });

    filterOutEveryRow();

    expect(() => hot.updateSettings({ mergeCells: false })).not.toThrow();
  });

  it('should not throw when the same merges are sent again while every row is filtered out', () => {
    const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 1 }];

    createGrid({ filters: true, mergeCells });

    filterOutEveryRow();

    // The React and Angular wrappers send unchanged settings again on every commit.
    expect(() => hot.updateSettings({ mergeCells })).not.toThrow();
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
    hot.getPlugin('filters').clearConditions();
    hot.getPlugin('filters').filter();

    expect(hot.countRows()).toBe(6);
    expect(hot.getCellMeta(0, 0).spanned).toBeUndefined();
    expect(hot.getCellMeta(0, 0).rowspan).toBeUndefined();
    expect(hot.getCellMeta(0, 0).colspan).toBeUndefined();
    expect(hot.getCellMeta(0, 1).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 0).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 1).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 1).copyable).toBe(true);
  });

  it('should not reset the meta of a foreign row that a trim slid onto the merge\'s stale position', () => {
    createGrid({
      filters: true,
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
    });

    hot.setCellMeta(4, 0, 'copyable', false);

    const filters = hot.getPlugin('filters');

    // Keeps only physical rows 4 and 5, which now sit at the visual rows 0 and 1 the hidden merge
    // still names.
    filters.addCondition(0, 'by_value', [['A5', 'A6']]);
    filters.filter();

    expect(hot.countRows()).toBe(2);

    hot.updateSettings({ mergeCells: [] });

    expect(hot.getCellMeta(0, 0).copyable).toBe(false);
  });

  it('should clear the merge meta of a partly trimmed merge, including its trimmed rows', () => {
    createGrid({
      filters: true,
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
    });

    const filters = hot.getPlugin('filters');

    // Stores the span keys on the original top-left cell.
    expect(hot.getCellMeta(0, 0).rowspan).toBe(3);

    // Trims physical row 0, the top row of the merge, so the merge now starts on physical row 1.
    // Column C sits outside the merge, so its values are not cleared by it.
    filters.addCondition(2, 'by_value', [['C2', 'C3', 'C4', 'C5', 'C6']]);
    filters.filter();

    expect(hot.countRows()).toBe(5);
    // Stores the span keys on the new, visible top-left cell as well.
    expect(hot.getCellMeta(0, 0).rowspan).toBe(2);

    hot.updateSettings({ mergeCells: [] });
    filters.clearConditions();
    filters.filter();

    expect(hot.countRows()).toBe(6);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const meta = hot.getCellMeta(row, col);

        expect(meta.hidden).toBeUndefined();
        expect(meta.copyable).toBe(true);
        expect(meta.spanned).toBeUndefined();
        expect(meta.rowspan).toBeUndefined();
        expect(meta.colspan).toBeUndefined();
      }
    }
  });
});
