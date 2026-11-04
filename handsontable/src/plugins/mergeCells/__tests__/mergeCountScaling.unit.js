import Handsontable from 'handsontable';
import * as mergeCellsUtils from '../utils';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Adding a merge checks it for an overlap with the merges already in the lookup matrix. The check reads the
 * new merge's own cells, so its cost does not grow with the number of merges. The tests count the work
 * instead of timing it: the lookups (`MergedCellsCollection#get`), and the merge-by-merge comparisons of a
 * scan of the merge list (`areMergesOverlapping`), which must not run at all for these small merges.
 */
describe('MergeCells adding many merges', () => {
  const MERGES = 200;
  // Per merge: the anchor lookups, two overlap checks over its four cells, and the anchor capture (about 22).
  // A check that scans every merge costs about `MERGES` lookups per merge instead.
  const LOOKUPS_PER_MERGE = 30;
  // Per restored merge: one overlap check over its four cells, the top-left lookup and the re-anchor (about 7).
  const RESTORE_LOOKUPS_PER_MERGE = 10;
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with two rows per merge and four columns.
   *
   * @returns {object} The MergeCells plugin.
   */
  function createGrid() {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(MERGES * 2, 4),
      licenseKey: TEST_LICENSE_KEY,
      mergeCells: true,
    });

    return hot.getPlugin('mergeCells');
  }

  it('looks up a constant number of cells per merge when merging in a batch', () => {
    const mergeCells = createGrid();
    const getSpy = spyOn(mergeCells.mergedCellsCollection, 'get').and.callThrough();
    const scanSpy = jest.spyOn(mergeCellsUtils, 'areMergesOverlapping');

    hot.batch(() => {
      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 0, (i * 2) + 1, 1);
      }
    });

    expect(mergeCells.mergedCellsCollection.mergedCells.length).toBe(MERGES);
    expect(getSpy.calls.count()).toBeLessThanOrEqual(MERGES * LOOKUPS_PER_MERGE);
    // Only while the collection holds fewer merges than a new merge has cells. A scan per add is MERGES² / 2.
    expect(scanSpy.mock.calls.length).toBeLessThan(MERGES);
  });

  it('looks up a constant number of cells per merge when restoring exported merges', () => {
    const mergeCells = createGrid();

    hot.batch(() => {
      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 0, (i * 2) + 1, 1);
      }
    });

    const exported = mergeCells._exportMergedAreas();

    hot.batch(() => {
      mergeCells.clearCollections();

      // Merges already on screen: the restore checks every area against them.
      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 2, (i * 2) + 1, 3);
      }
    });

    const getSpy = spyOn(mergeCells.mergedCellsCollection, 'get').and.callThrough();
    const scanSpy = jest.spyOn(mergeCellsUtils, 'areMergesOverlapping');

    mergeCells.restoreMergedAreas(exported);

    expect(mergeCells.mergedCellsCollection.mergedCells.length).toBe(MERGES * 2);
    expect(getSpy.calls.count()).toBeLessThanOrEqual(MERGES * RESTORE_LOOKUPS_PER_MERGE);
    // Only while the collection holds fewer merges than a new merge has cells. A scan per add is MERGES² / 2.
    expect(scanSpy.mock.calls.length).toBeLessThan(MERGES);
  });

  it('still refuses a merge over an existing one when many merges are present', () => {
    const warnSpy = spyOn(console, 'warn');
    const mergeCells = createGrid();

    hot.batch(() => {
      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 0, (i * 2) + 1, 1);
      }
    });

    mergeCells.merge(11, 1, 12, 2); // B12:C13 overlaps the merges A11:B12 and A13:B14

    expect(mergeCells.mergedCellsCollection.mergedCells.length).toBe(MERGES);
    expect(mergeCells.mergedCellsCollection.get(11, 2)).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('still refuses to restore a merge over one that was on screen before the restore', () => {
    const mergeCells = createGrid();

    hot.batch(() => {
      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 0, (i * 2) + 1, 1);
      }
    });

    const exported = mergeCells._exportMergedAreas();

    hot.batch(() => {
      mergeCells.clearCollections();

      for (let i = 0; i < MERGES; i++) {
        mergeCells.merge(i * 2, 2, (i * 2) + 1, 3);
      }
    });

    mergeCells.merge(41, 0, 42, 1); // A42:B43 overlaps the stored merges A41:B42 and A43:B44
    mergeCells.restoreMergedAreas(exported);

    const collection = mergeCells.mergedCellsCollection;

    expect(collection.get(41, 0)).toEqual(jasmine.objectContaining({ row: 41, col: 0, rowspan: 2, colspan: 2 }));
    expect(collection.get(40, 0)).toBe(false);
    expect(collection.get(43, 0)).toBe(false);
    expect(collection.get(0, 0)).toEqual(jasmine.objectContaining({ row: 0, col: 0, rowspan: 2, colspan: 2 }));
    expect(collection.mergedCells.length).toBe((MERGES * 2) - 1);
  });
});
