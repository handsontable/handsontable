import Handsontable from 'handsontable/base';
import { ManualColumnMove, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ManualColumnMove);

describe('ManualColumnMove – where moved columns land next to trimmed columns', () => {
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
   * Creates a grid of 6 columns `c0`...`c5` with the given physical columns trimmed or hidden.
   *
   * @param {number[]} columns Physical indexes of the skipped columns.
   * @param {'trimming'|'hiding'} mapType Kind of the index map that skips the columns.
   * @returns {ManualColumnMove}
   */
  function createGrid(columns, mapType = 'trimming') {
    hot?.destroy();
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [Array.from({ length: 6 }, (_, index) => `c${index}`)],
      manualColumnMove: true,
    });

    const map = hot.columnIndexMapper.createAndRegisterIndexMap('test-skip', mapType);

    columns.forEach(column => map.setValueAtIndex(column, true));

    return hot.getPlugin('manualColumnMove');
  }

  const sequence = () => hot.columnIndexMapper.getIndexesSequence();
  const visibleOrder = () => hot.columnIndexMapper.getRenderableIndexes().map(index => `c${index}`);

  describe('trimmed columns', () => {
    it('should place a column moved to the start after the trimmed columns that lead the grid', () => {
      const plugin = createGrid([0, 1]);

      // Visual columns are the physical columns 2, 3, 4, 5. Column `1` is the physical column 3.
      expect(plugin.moveColumn(1, 0)).toBe(true);
      expect(sequence()).toEqual([0, 1, 3, 2, 4, 5]);
    });

    it('should place a column moved to the last position right after the last visible column, before the trailing trimmed columns', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveColumn(0, 3)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
    });

    it('should place a column moved forward before the visible column at the target position, after the trimmed block', () => {
      const plugin = createGrid([2, 3]);

      // Visual columns are the physical columns 0, 1, 4, 5. The target is the visual column 2 (the physical column 5).
      expect(plugin.moveColumn(0, 2)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 4, 0, 5]);
    });

    it('should place a column moved back before the visible column at the target position, after the trimmed block', () => {
      const plugin = createGrid([2, 3]);

      expect(plugin.moveColumn(3, 2)).toBe(true);
      expect(sequence()).toEqual([0, 1, 2, 3, 5, 4]);
    });

    it('should place a dragged column after the trimmed block that sits at the drop position', () => {
      const plugin = createGrid([2, 3]);

      // Dropping before the visual column 2 (the physical column 4) is the same gesture as `moveColumn(0, 1)`.
      expect(plugin.dragColumn(0, 2)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
    });

    describe('every single-column move around a trimmed block at the end of the grid', () => {
      // Visual columns are the physical columns 0, 1, 5. The columns 2, 3, 4 are trimmed and stay together.
      [
        { from: 0, to: 1, expected: [1, 2, 3, 4, 0, 5] },
        { from: 0, to: 2, expected: [1, 2, 3, 4, 5, 0] },
        { from: 1, to: 0, expected: [1, 0, 2, 3, 4, 5] },
        { from: 1, to: 2, expected: [0, 2, 3, 4, 5, 1] },
        { from: 2, to: 0, expected: [5, 0, 1, 2, 3, 4] },
        { from: 2, to: 1, expected: [0, 5, 1, 2, 3, 4] },
      ].forEach(({ from, to, expected }) => {
        it(`should place the result of moveColumn(${from}, ${to}) at ${JSON.stringify(expected)}`, () => {
          const plugin = createGrid([2, 3, 4]);

          expect(plugin.moveColumn(from, to)).toBe(true);
          expect(sequence()).toEqual(expected);
        });
      });
    });

    it('should place a block of columns moved to the last position right after the last visible column', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveColumns([0, 1], 2)).toBe(true);
      expect(sequence()).toEqual([2, 3, 0, 1, 4, 5]);
    });

    it('should place a block of columns that stops short of the last position before the visible column at the target', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveColumns([0, 1], 1)).toBe(true);
      expect(sequence()).toEqual([2, 0, 1, 3, 4, 5]);
    });

    it('should show the requested order once the trimmed columns are untrimmed, for the move to the last position', () => {
      const plugin = createGrid([4, 5]);

      plugin.moveColumn(0, 3);
      hot.columnIndexMapper.unregisterMap('test-skip');

      expect(hot.getDataAtRow(0)).toEqual(['c1', 'c2', 'c3', 'c0', 'c4', 'c5']);
    });
  });

  describe('hidden columns', () => {
    /**
     * Drags the first column of a grid with the columns 2 and 3 hidden and returns the visible order.
     *
     * @param {number} dropIndex Visual drop index.
     * @returns {string[]}
     */
    function dragFirstColumnAndReadVisibleOrder(dropIndex) {
      createGrid([2, 3], 'hiding').dragColumn(0, dropIndex);

      return visibleOrder();
    }

    it('should give the same visible order for a drop on either side of a hidden block', () => {
      // The pointer between the renderable columns 1 and 2 resolves to the drop index 2 (the right half of the
      // column before the block) or 4 (the left half of the column after it). The physical order differs, the visible one does not.
      expect(dragFirstColumnAndReadVisibleOrder(2)).toEqual(['c1', 'c0', 'c4', 'c5']);
      expect(dragFirstColumnAndReadVisibleOrder(4)).toEqual(['c1', 'c0', 'c4', 'c5']);
    });
  });
});
