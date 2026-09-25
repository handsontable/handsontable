import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { CustomBorders } from '../../customBorders/customBorders';
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
    registerPlugin(CustomBorders);
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
   * Builds an 8x8 grid with one merge, then loads a smaller dataset over it.
   *
   * @param {object} area The merge area.
   * @param {number} [size=3] The size the dataset is shrunk to.
   * @returns {object} The Handsontable instance.
   */
  function shrink(area = { row: 6, col: 6, rowspan: 2, colspan: 2 }, size = 3) {
    hot = new Handsontable(container, {
      data: square(8),
      mergeCells: [area],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(size));

    return hot;
  }

  // The merge sat at the bottom-RIGHT corner in every case at first, so each half of the bounds
  // guard the plugin used to carry was individually dead weight as far as the suite could tell. The
  // guard is gone - `Core#removeCellMeta` answers an out-of-range index now - and these are the
  // shapes that separate the two axes, and the covered-cell walk from the master-cell removals, at
  // the `>=` / `>` boundary.
  const shapes = [
    { name: 'the bottom edge only', area: { row: 6, col: 0, rowspan: 2, colspan: 2 }, size: 3 },
    { name: 'the right edge only', area: { row: 0, col: 6, rowspan: 2, colspan: 2 }, size: 3 },
    { name: 'the bottom-right corner', area: { row: 6, col: 6, rowspan: 2, colspan: 2 }, size: 3 },
    {
      name: 'the exact boundary on a covered cell (row === countRows())',
      area: { row: 6, col: 6, rowspan: 2, colspan: 2 },
      size: 7,
    },
    {
      name: 'the exact boundary on the master cell (row === countRows())',
      area: { row: 6, col: 6, rowspan: 2, colspan: 2 },
      size: 6,
    },
  ];

  shapes.forEach(({ name, area, size }) => {
    describe(`a merge past ${name}`, () => {
      it('should not throw when the mergeCells setting is emptied', () => {
        // The plugin registers no `afterLoadData` hook, so the collection still holds the previous
        // grid's coordinates. `updatePlugin()` runs `clearCollections()`, which walks every covered
        // cell into `removeCellMeta`, and the meta manager's index assertion took the whole call
        // down with "Expecting an unsigned number".
        shrink(area, size);

        expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
      });

      it('should not throw when the mergeCells setting is replaced with an in-range merge', () => {
        shrink(area, size);

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
          mergeCells: [area],
          licenseKey: 'non-commercial-and-evaluation',
        });

        hot.updateSettings({ data: square(size) });

        expect(() => hot.updateSettings({ mergeCells: [] })).not.toThrow();
        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
      });
    });
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

  it('should leave no orphaned merge or border meta behind a shrinking updateData', () => {
    // The measured defect. `updateData` keeps the cell meta (only `loadData` calls
    // `metaManager.clearCellsCache()`), so after shrink -> reset -> regrow the old merge's `hidden`,
    // `copyable`, `spanned` and `rowspan` and the old border's `borders` were back on live cells
    // with no model behind them, and `getCopyableText(6, 6, 7, 7)` returned "G7\t\n\t" - the copy of
    // the old merge area blanked by `copyable: false`.
    hot = new Handsontable(container, {
      data: square(8),
      mergeCells: [{ row: 6, col: 6, rowspan: 2, colspan: 2 }],
      customBorders: [{ row: 7, col: 7, top: { width: 2, color: 'red' } }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateData(square(3));
    hot.updateSettings({ mergeCells: [], customBorders: [] });
    hot.updateData(square(8));

    expect(hot.getCellMeta(6, 6).spanned).toBeUndefined();
    expect(hot.getCellMeta(6, 6).rowspan).toBeUndefined();
    expect(hot.getCellMeta(6, 6).colspan).toBeUndefined();
    expect(hot.getCellMeta(6, 7).hidden).toBeUndefined();
    // `copyable` has a schema default of `true`, so a cleared cell resolves back to it rather than
    // to `undefined`. The stale state this pins reported `false`.
    expect(hot.getCellMeta(6, 7).copyable).toBe(true);
    expect(hot.getCellMeta(7, 6).hidden).toBeUndefined();
    expect(hot.getCellMeta(7, 7).hidden).toBeUndefined();
    expect(hot.getCellMeta(7, 7).borders).toBeUndefined();

    expect(hot.getCopyableText(6, 6, 7, 7)).toBe('6-6\t6-7\n7-6\t7-7');
  });
});
