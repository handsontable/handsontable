import Handsontable from 'handsontable';

/**
 * `_exportMergedAreas()` hands out each merge with the physical rows it owns and its physical left column, and
 * `restoreMergedAreas()` places such an entry from those against the index cache in force when it runs, so a
 * merge restored under another row or column order covers the same cells.
 */
describe('MergeCells anchored merged areas', () => {
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
   * Builds a grid of six rows and four columns.
   *
   * @param {object} settings Extra settings.
   * @returns {object} The MergeCells plugin.
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(6, 4),
      licenseKey: 'non-commercial-and-evaluation',
      mergeCells: true,
      ...settings,
    });

    return hot.getPlugin('mergeCells');
  }

  /**
   * Lists the merges in the collection as `[row, col, rowspan, colspan]`.
   *
   * @returns {Array[]}
   */
  function mergedAreas() {
    return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
  }

  describe('_exportMergedAreas()', () => {
    it('adds the physical rows and left column of each merge to its geometry', () => {
      const mergeCells = createGrid({ manualRowMove: true, manualColumnMove: true });

      hot.getPlugin('manualRowMove').moveRow(5, 0);
      hot.getPlugin('manualColumnMove').moveColumn(3, 0);
      hot.render();
      mergeCells.merge(1, 1, 2, 2);

      expect(mergeCells._exportMergedAreas()).toEqual([
        { row: 1, col: 1, rowspan: 2, colspan: 2, physicalRows: [0, 1], physicalColumn: 0 },
      ]);
    });

    it('returns copies of the anchor rows', () => {
      const mergeCells = createGrid();

      mergeCells.merge(1, 1, 2, 2);

      const [area] = mergeCells._exportMergedAreas();

      area.physicalRows.push(5);

      expect(mergeCells._exportMergedAreas()[0].physicalRows).toEqual([1, 2]);
    });

    it('leaves out a merge whose rows are all trimmed, as `getVisibleMergedAreas()` does', () => {
      const mergeCells = createGrid({ trimRows: true });

      mergeCells.merge(0, 0, 1, 1);
      mergeCells.merge(3, 0, 4, 1);
      hot.getPlugin('trimRows').trimRows([3, 4]);

      expect(mergeCells._exportMergedAreas()).toEqual([
        { row: 0, col: 0, rowspan: 2, colspan: 2, physicalRows: [0, 1], physicalColumn: 0 },
      ]);
    });
  });

  describe('restoreMergedAreas() with anchors', () => {
    it('places an anchored area where its rows and column are now drawn', () => {
      const mergeCells = createGrid({ manualRowMove: true, manualColumnMove: true });

      hot.getPlugin('manualRowMove').moveRow(5, 0);
      hot.getPlugin('manualColumnMove').moveColumn(3, 0);
      hot.render();

      mergeCells.restoreMergedAreas([
        { row: 0, col: 0, rowspan: 2, colspan: 2, physicalRows: [2, 3], physicalColumn: 1 },
      ]);

      expect(mergedAreas()).toEqual([[3, 2, 2, 2]]);
      expect(hot.getCellMeta(3, 2).spanned).toBe(true);
      expect(mergeCells._exportMergedAreas()[0]).toEqual(
        { row: 3, col: 2, rowspan: 2, colspan: 2, physicalRows: [2, 3], physicalColumn: 1 }
      );
    });

    it('keeps the rows a merge owns when a sort has scattered them', () => {
      const mergeCells = createGrid({ manualRowMove: true });

      hot.rowIndexMapper.setIndexesSequence([4, 0, 5, 1, 2, 3]);
      hot.render();

      mergeCells.restoreMergedAreas([
        { row: 0, col: 1, rowspan: 2, colspan: 2, physicalRows: [0, 1], physicalColumn: 1 },
      ]);

      expect(mergedAreas()).toEqual([[1, 1, 2, 2]]);
      expect(mergeCells._exportMergedAreas()[0].physicalRows).toEqual([0, 1]);

      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4, 5]);

      expect(mergedAreas()).toEqual([[0, 1, 2, 2]]);
    });

    it('skips an anchor that names a row or a column past the data', () => {
      const mergeCells = createGrid();

      mergeCells.restoreMergedAreas([
        { row: 4, col: 0, rowspan: 2, colspan: 2, physicalRows: [5, 6], physicalColumn: 0 },
        { row: 0, col: 3, rowspan: 2, colspan: 2, physicalRows: [0, 1], physicalColumn: 4 },
        { row: 0, col: 0, rowspan: 2, colspan: 2, physicalRows: [0, 1], physicalColumn: 0 },
      ]);

      expect(mergedAreas()).toEqual([[0, 0, 2, 2]]);
    });

    it('places an area without an anchor by its visual geometry', () => {
      const mergeCells = createGrid({ manualRowMove: true });

      hot.getPlugin('manualRowMove').moveRow(5, 0);
      hot.render();
      mergeCells.restoreMergedAreas([{ row: 0, col: 0, rowspan: 2, colspan: 2 }]);

      expect(mergedAreas()).toEqual([[0, 0, 2, 2]]);
      expect(mergeCells._exportMergedAreas()[0].physicalRows).toEqual([5, 0]);
    });
  });
});
