import Handsontable from 'handsontable';

/**
 * The internal methods another plugin (SheetsBar) uses to capture and restore merges around a
 * data load, instead of reaching into the merge collection itself.
 */
describe('MergeCells merged areas API', () => {
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
      data: Handsontable.helper.createSpreadsheetData(6, 4),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  function mergedAreas() {
    return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
  }

  describe('getVisibleMergedAreas()', () => {
    it('returns plain geometry records of the merges on screen', () => {
      createGrid({
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }, { row: 3, col: 1, rowspan: 1, colspan: 3 }],
      });

      const areas = hot.getPlugin('mergeCells').getVisibleMergedAreas();

      expect(areas).toEqual([
        { row: 0, col: 0, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 1, colspan: 3 },
      ]);
      expect(Object.keys(areas[0])).toEqual(['row', 'col', 'rowspan', 'colspan']);
    });

    it('leaves out a merge whose rows are all trimmed', () => {
      createGrid({ mergeCells: true, trimRows: true });

      const mergeCells = hot.getPlugin('mergeCells');

      mergeCells.merge(0, 0, 1, 1);
      mergeCells.merge(3, 0, 4, 1);
      hot.getPlugin('trimRows').trimRows([3, 4]);

      expect(mergedAreas()).toHaveLength(2);
      expect(mergeCells.getVisibleMergedAreas()).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 2 }]);
    });
  });

  describe('restoreMergedAreas()', () => {
    it('merges the areas as automatic merges without writing any cell', () => {
      createGrid({ mergeCells: true });

      const afterChange = jest.fn();
      const afterMergeCells = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.addHook('afterMergeCells', afterMergeCells);
      hot.getPlugin('mergeCells').restoreMergedAreas([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);

      expect(mergedAreas()).toEqual([[1, 1, 2, 2]]);
      expect(hot.getDataAtCell(2, 2)).toBe('C3');
      expect(afterChange).not.toHaveBeenCalled();
      expect(afterMergeCells).toHaveBeenCalledTimes(1);
      expect(afterMergeCells.mock.calls[0][2]).toBe(true);
    });

    it('skips an area that does not fit the grid', () => {
      createGrid({ mergeCells: true });

      hot.getPlugin('mergeCells').restoreMergedAreas([
        { row: 5, col: 0, rowspan: 2, colspan: 2 },
        { row: 0, col: 3, rowspan: 2, colspan: 2 },
        { row: 0, col: 0, rowspan: 2, colspan: 2 },
      ]);

      expect(mergedAreas()).toEqual([[0, 0, 2, 2]]);
    });

    it('skips an area that overlaps a merge already on screen', () => {
      createGrid({ mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }] });

      hot.getPlugin('mergeCells').restoreMergedAreas([
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 0, rowspan: 2, colspan: 2 },
      ]);

      expect(mergedAreas()).toEqual([[0, 0, 2, 2], [3, 0, 2, 2]]);
    });
  });
});
