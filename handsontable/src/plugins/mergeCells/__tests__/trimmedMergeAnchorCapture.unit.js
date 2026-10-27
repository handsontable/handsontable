import Handsontable from 'handsontable';

/**
 * A merge made while rows are trimmed has to own the trimmed rows that sit between the rows it
 * covers. Without them the merge drew over a row it did not own once the rows came back, and left
 * its own last row uncovered and emptied (DEV-507).
 */
describe('MergeCells anchor captured while rows are trimmed', () => {
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
      data: Handsontable.helper.createSpreadsheetData(8, 3),
      licenseKey: 'non-commercial-and-evaluation',
      mergeCells: true,
      width: 400,
      height: 300,
      ...settings,
    });

    return hot;
  }

  function mergeGeometry() {
    const collection = hot.getPlugin('mergeCells').mergedCellsCollection;

    // The lookup matrix decides what is drawn, so a merge the matrix does not hold is not reported.
    return collection.mergedCells
      .filter(merge => collection.get(merge.row, merge.col) === merge)
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
  }

  it('should span the trimmed row between the merged rows once it comes back', () => {
    createGrid({ trimRows: [2] });

    // Visual rows 1..3 are the physical rows 1, 3 and 4.
    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 4, 2]]);
    expect(hot.getSourceDataAtCell(2, 0)).toBe('A3');
    expect(hot.getSourceDataAtCell(2, 1)).toBe('B3');
  });

  it('should span several trimmed rows between the merged rows once they come back', () => {
    createGrid({ trimRows: [2, 3] });

    hot.getPlugin('mergeCells').merge(0, 0, 3, 0);
    hot.getPlugin('trimRows').untrimAll();

    // Physical rows 0, 1, 4 and 5 were merged, and 2 and 3 sat between 1 and 4.
    expect(mergeGeometry()).toEqual([[0, 0, 6, 1]]);
  });

  it('should shrink the merge to its visible rows again when the rows are trimmed again', () => {
    createGrid({ trimRows: [2] });

    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);
    hot.getPlugin('trimRows').untrimAll();
    hot.getPlugin('trimRows').trimRows([2]);

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 4, 2]]);
  });

  it('should do the same for rows a filter removes from view', () => {
    createGrid({ filters: true });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', ['A3']);
    filters.filter();

    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);
    filters.clearConditions();
    filters.filter();

    expect(mergeGeometry()).toEqual([[1, 0, 4, 2]]);
  });

  it('should not grow over a trimmed row right below the merged rows', () => {
    createGrid({ trimRows: [4] });

    // Visual rows 1..3 are the physical rows 1, 2 and 3. Physical row 4 follows them.
    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });

  it('should not grow over a trimmed row right above the merged rows', () => {
    createGrid({ trimRows: [0] });

    // Visual rows 0..2 are the physical rows 1, 2 and 3. Physical row 0 precedes them.
    hot.getPlugin('mergeCells').merge(0, 0, 2, 1);

    expect(mergeGeometry()).toEqual([[0, 0, 3, 2]]);

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });

  it('should follow the row order of a descending sort', () => {
    createGrid({
      columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } },
      trimRows: [4],
    });

    // The rows read A8..A1 from the top, so visual rows 1..4 are the physical rows 6, 5, 3 and 2,
    // and the trimmed physical row 4 sits between 5 and 3.
    hot.getPlugin('mergeCells').merge(1, 0, 4, 1);

    expect(mergeGeometry()).toEqual([[1, 0, 4, 2]]);

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 5, 2]]);
  });

  it('should keep an area declared in the settings on the rows that were on screen', () => {
    createGrid({ trimRows: [2], mergeCells: [{ row: 1, col: 0, rowspan: 3, colspan: 2 }] });

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);

    hot.getPlugin('trimRows').untrimAll();

    // The settings describe the rows on screen, so the area does not take the row that was trimmed.
    // The block then draws over that row and leaves the area's own last row outside it, as it did before.
    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });

  it('should not grow a merge whose rows are all visible when rows elsewhere are trimmed', () => {
    createGrid({ trimRows: [6] });

    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });

  it('should keep the trimmed row in the merge when the sheets bar captures and restores it', () => {
    createGrid({ trimRows: [2] });

    const mergeCells = hot.getPlugin('mergeCells');

    mergeCells.merge(1, 0, 3, 1);

    // What a sheet switch does around its data load.
    const areas = mergeCells.getVisibleMergedAreas();

    mergeCells.clearCollections();
    mergeCells.restoreMergedAreas(areas);
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 4, 2]]);
  });

  it('should not take a trimmed row another merge owns', () => {
    createGrid({ trimRows: [] });

    const mergeCells = hot.getPlugin('mergeCells');

    mergeCells.merge(2, 0, 3, 0);
    // Every row of the first merge is trimmed, so it is no longer in the lookup matrix.
    hot.getPlugin('trimRows').trimRows([2, 3]);

    // Visual rows 1 and 2 are the physical rows 1 and 4.
    mergeCells.merge(1, 1, 2, 1);
    hot.getPlugin('trimRows').untrimAll();

    // The second merge keeps the rows it covered and does not claim physical rows 2 and 3.
    expect(mergeCells.mergedCellsCollection.mergedCells.map(({ row, col, rowspan }) => [row, col, rowspan]))
      .toEqual([[2, 0, 2], [1, 1, 2]]);
  });

  it('should not take a stretch that holds a visible row the merge does not cover', () => {
    createGrid({ trimRows: [2] });

    const mergeCells = hot.getPlugin('mergeCells');

    // A move inside a batch leaves the row index cache behind the index sequence until the batch ends.
    hot.batch(() => {
      hot.getPlugin('manualRowMove').moveRow(5, 3);
      mergeCells.merge(1, 0, 3, 1);
    });
    hot.getPlugin('trimRows').untrimAll();

    // The merge keeps the three rows it covered and takes no visible row it did not cover.
    expect(mergeGeometry().map(([, , rowspan]) => rowspan)).toEqual([3]);
  });
});
