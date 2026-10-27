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
    return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
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
    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });

  it('should not grow a merge whose rows are all visible when rows elsewhere are trimmed', () => {
    createGrid({ trimRows: [6] });

    hot.getPlugin('mergeCells').merge(1, 0, 3, 1);
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[1, 0, 3, 2]]);
  });
});
