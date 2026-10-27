import Handsontable from 'handsontable';

/**
 * A merge declared in the `mergeCells` option while a row inside its span is trimmed has to own that
 * row, like a merge made at runtime. Without it the merge drew over a row it did not own once the row
 * came back, and left its own last row uncovered and emptied.
 */
describe('MergeCells declared in the settings while a row inside its span is trimmed', () => {
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
      data: Handsontable.helper.createSpreadsheetData(10, 5),
      licenseKey: 'non-commercial-and-evaluation',
      width: 600,
      height: 400,
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

  const declared = [{ row: 2, col: 2, rowspan: 3, colspan: 3 }];

  it('should span the trimmed row between the declared rows once it comes back', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    // Visual rows 2..4 are the physical rows 2, 4 and 5.
    expect(mergeGeometry()).toEqual([[2, 2, 3, 3]]);

    hot.getPlugin('trimRows').untrimAll();

    // Physical rows 2, 3, 4 and 5 belong to the merge.
    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
    expect(hot.getSourceDataAtCell(3, 2)).toBe('C4');
    expect(hot.getSourceDataAtCell(5, 2)).toBeNull();
  });

  it('should span the trimmed row between the declared rows when a filter removes it from the start', () => {
    createGrid({ filters: true, mergeCells: false });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', ['A4']);
    filters.filter();
    hot.updateSettings({ mergeCells: declared });

    expect(mergeGeometry()).toEqual([[2, 2, 3, 3]]);

    filters.clearConditions();
    filters.filter();

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
  });

  it('should keep the span when the same areas are sent again while the row is trimmed', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.updateSettings({ mergeCells: declared.map(area => ({ ...area })) });

    expect(mergeGeometry()).toEqual([[2, 2, 3, 3]]);

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
  });

  it('should keep the span when the same areas are sent again after the row came back', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.getPlugin('trimRows').untrimAll();
    hot.updateSettings({ mergeCells: declared.map(area => ({ ...area })) });

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
  });

  it('should not clear the values of the returning row when the same areas are sent again', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.getPlugin('trimRows').untrimAll();
    hot.updateSettings({ mergeCells: declared.map(area => ({ ...area })) });

    expect(hot.getSourceDataAtCell(3, 2)).toBe('C4');
    expect(hot.getSourceDataAtCell(3, 4)).toBe('E4');
  });

  it('should build a different area from the rows on screen', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.getPlugin('trimRows').untrimAll();
    hot.updateSettings({ mergeCells: [{ row: 6, col: 0, rowspan: 2, colspan: 2 }] });

    expect(mergeGeometry()).toEqual([[6, 0, 2, 2]]);
  });

  it('should not take a trimmed row above the first or below the last declared row', () => {
    createGrid({ trimRows: [1, 5], mergeCells: declared });

    // Visual rows 2..4 are the physical rows 3, 4 and 6; 1 sits above and 5 sits inside the span.
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[3, 2, 4, 3]]);
  });

  it('should let two merges in different columns take the same trimmed row', () => {
    createGrid({
      trimRows: [3],
      mergeCells: [
        { row: 2, col: 0, rowspan: 3, colspan: 2 },
        { row: 2, col: 2, rowspan: 3, colspan: 3 },
      ],
    });

    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[2, 0, 4, 2], [2, 2, 4, 3]]);
  });

  it('should keep the area below a merge that took a trimmed row when the same areas are sent again', () => {
    const areas = [
      { row: 2, col: 0, rowspan: 3, colspan: 2 },
      { row: 5, col: 0, rowspan: 2, colspan: 2 },
    ];

    createGrid({ trimRows: [3], mergeCells: areas });

    // Visual rows 5 and 6 are the physical rows 6 and 7 while row 3 is trimmed.
    hot.getPlugin('trimRows').untrimAll();

    expect(mergeGeometry()).toEqual([[2, 0, 4, 2], [6, 0, 2, 2]]);

    hot.updateSettings({ mergeCells: areas.map(area => ({ ...area })) });

    expect(mergeGeometry()).toEqual([[2, 0, 4, 2], [6, 0, 2, 2]]);
  });

  it('should rebuild an area from the rows on screen when its rowspan changes after the row came back', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.getPlugin('trimRows').untrimAll();
    hot.updateSettings({ mergeCells: [{ row: 2, col: 2, rowspan: 2, colspan: 3 }] });

    expect(mergeGeometry()).toEqual([[2, 2, 2, 3]]);
  });

  it('should keep the span when the same areas are sent again after a sheet switch restored the merge', () => {
    createGrid({ trimRows: [3], mergeCells: declared });

    hot.getPlugin('trimRows').untrimAll();

    const plugin = hot.getPlugin('mergeCells');
    const areas = plugin.getVisibleMergedAreas();

    // What a sheet switch does: drop the merges, then merge the captured areas again.
    plugin.clearCollections();
    plugin.restoreMergedAreas(areas);

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);

    hot.updateSettings({ mergeCells: declared.map(area => ({ ...area })) });

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
    expect(hot.getSourceDataAtCell(3, 2)).toBe('C4');
  });

  it('should keep the span when the same areas are sent again after an undo brought the merge back', () => {
    createGrid({ trimRows: [3], mergeCells: declared, undo: true });

    hot.getPlugin('trimRows').untrimAll();
    hot.getPlugin('mergeCells').unmerge(2, 2, 5, 4);

    expect(mergeGeometry()).toEqual([]);

    hot.getPlugin('undoRedo').undo();

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);

    hot.updateSettings({ mergeCells: declared.map(area => ({ ...area })) });

    expect(mergeGeometry()).toEqual([[2, 2, 4, 3]]);
    expect(hot.getSourceDataAtCell(3, 2)).toBe('C4');
  });
});
