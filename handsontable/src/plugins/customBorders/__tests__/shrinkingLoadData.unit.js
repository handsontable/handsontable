import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { CustomBorders } from '../customBorders';

/**
 * Builds a square dataset.
 *
 * @param {number} size The number of rows and columns.
 * @returns {Array[]}
 */
function square(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (__, col) => `${row}-${col}`));
}

describe('CustomBorders after a shrinking loadData', () => {
  let container;
  let hot;

  beforeAll(() => {
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
   * Builds an 8x8 grid with one border, then loads a smaller dataset over it.
   *
   * @param {object} entry The border entry coordinates.
   * @param {number} [size=3] The size the dataset is shrunk to.
   * @returns {object} The Handsontable instance.
   */
  function shrink(entry = { row: 7, col: 7 }, size = 3) {
    hot = new Handsontable(container, {
      data: square(8),
      customBorders: [{ ...entry, top: { width: 2, color: 'red' } }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(size));

    return hot;
  }

  // The border sat at the bottom-RIGHT corner in every case at first, so each half of the bounds
  // guard the plugin used to carry was individually dead weight as far as the suite could tell. The
  // guard is gone - `Core#removeCellMeta` answers an out-of-range index now - and these are the
  // shapes that separate the two axes and the `>=` / `>` boundary from each other.
  const shapes = [
    { name: 'bottom edge only', entry: { row: 6, col: 0 }, size: 3 },
    { name: 'right edge only', entry: { row: 0, col: 6 }, size: 3 },
    { name: 'bottom-right corner', entry: { row: 6, col: 6 }, size: 3 },
    { name: 'the exact boundary (row === countRows())', entry: { row: 7, col: 7 }, size: 7 },
  ];

  shapes.forEach(({ name, entry, size }) => {
    describe(`a border past ${name}`, () => {
      it('should not throw when the customBorders setting is emptied', () => {
        // The plugin registers no `afterLoadData` hook, so `savedBorders` still holds the previous
        // grid's coordinates. Clearing the model then asked `removeCellMeta` about a cell outside
        // the current range, and the meta manager's index assertion took the whole call down with
        // "Expecting an unsigned number".
        shrink(entry, size);

        expect(() => hot.updateSettings({ customBorders: [] })).not.toThrow();
        expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
      });

      it('should not throw when the customBorders setting is replaced with an in-range entry', () => {
        shrink(entry, size);

        expect(() => hot.updateSettings({
          customBorders: [{ row: 0, col: 0, top: { width: 1, color: 'blue' } }],
        })).not.toThrow();

        const borders = hot.getPlugin('customBorders').getBorders();

        expect(borders).toHaveLength(1);
        expect(borders[0].row).toBe(0);
        expect(borders[0].col).toBe(0);
      });

      it('should not throw when clearBorders() is called', () => {
        shrink(entry, size);

        expect(() => hot.getPlugin('customBorders').clearBorders()).not.toThrow();
        expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
      });
    });
  });

  it('should still clear the cell meta of an in-range border on a same-size loadData', () => {
    // The control: nothing went out of range here, so the entry must take the normal path and have
    // its `borders` meta removed rather than being dropped from the model untouched.
    hot = new Handsontable(container, {
      data: square(8),
      customBorders: [{ row: 1, col: 1, top: { width: 2, color: 'red' } }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(8));

    expect(() => hot.getPlugin('customBorders').clearBorders()).not.toThrow();
    expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
    expect(hot.getCellMeta(1, 1).borders).toBeUndefined();
  });

  it('should clear the borders meta a shrinking updateData left behind, on every shape', () => {
    // `updateData` keeps the cell meta (only `loadData` calls `metaManager.clearCellsCache()`), so
    // the `borders` key really is still there while the grid is small. Skipping the removal left it
    // addressing a live cell once the data grew back, with no entry in the border model behind it.
    shapes.forEach(({ entry, size }) => {
      hot = new Handsontable(container, {
        data: square(8),
        customBorders: [{ ...entry, top: { width: 2, color: 'red' } }],
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.updateData(square(size));
      hot.updateSettings({ customBorders: [] });
      hot.updateData(square(8));

      expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
      expect(hot.getCellMeta(entry.row, entry.col).borders).toBeUndefined();

      hot.destroy();
      hot = null;
    });
  });
});
