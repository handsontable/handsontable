import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MergeCells } from '../mergeCells';

/**
 * Builds a square dataset.
 *
 * @param {number} size The number of rows and columns.
 * @returns {Array[]}
 */
function square(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (__, col) => `${row}-${col}`));
}

describe('MergeCells after a shrinking loadData', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(MergeCells);
  });

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
   * Builds an 8x8 grid with a merge on its bottom-right corner, then loads a 3x3 dataset over it.
   *
   * @returns {object} The Handsontable instance.
   */
  function shrink() {
    hot = new Handsontable(container, {
      data: square(8),
      mergeCells: [{ row: 6, col: 6, rowspan: 2, colspan: 2 }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(3));

    return hot;
  }

  it('should not throw when the mergeCells setting is emptied', () => {
    // The plugin registers no `afterLoadData` hook, so the collection still holds the merge at
    // `{ row: 6, col: 6 }` while the grid is 3x3. `updatePlugin()` runs `clearCollections()`, which
    // walks every covered cell into `removeCellMeta`, and the meta manager's index assertion took
    // the whole call down with "Expecting an unsigned number".
    shrink();

    expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
  });

  it('should not throw when the mergeCells setting is replaced with an in-range merge', () => {
    shrink();

    expect(() => hot.updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
    })).not.toThrow();

    const { mergedCells } = hot.getPlugin('mergeCells').mergedCellsCollection;

    expect(mergedCells).toHaveLength(1);
    expect(mergedCells[0].row).toBe(0);
    expect(mergedCells[0].col).toBe(0);
  });

  it('should not throw when the data is shrunk through updateSettings', () => {
    hot = new Handsontable(container, {
      data: square(8),
      mergeCells: [{ row: 6, col: 6, rowspan: 2, colspan: 2 }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({ data: square(3) });

    expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
  });

  it('should still clear the merge cell meta of an in-range merge on a same-size loadData', () => {
    // The control: nothing went out of range here, so every covered cell must take the normal path
    // and have its merge-related meta removed rather than being skipped.
    hot = new Handsontable(container, {
      data: square(8),
      mergeCells: [{ row: 6, col: 6, rowspan: 2, colspan: 2 }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(8));

    expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
    expect(hot.getCellMeta(6, 6).spanned).toBeUndefined();
    expect(hot.getCellMeta(6, 6).rowspan).toBeUndefined();
    expect(hot.getCellMeta(6, 6).colspan).toBeUndefined();
    expect(hot.getCellMeta(7, 7).hidden).toBeUndefined();
  });
});
