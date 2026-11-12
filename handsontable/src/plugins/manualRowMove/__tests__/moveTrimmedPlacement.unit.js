import Handsontable from 'handsontable/base';
import { ManualRowMove, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ManualRowMove);

describe('ManualRowMove – where moved rows land next to trimmed rows', () => {
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
   * Creates a grid of 6 rows `r0`...`r5` with the given physical rows trimmed or hidden.
   *
   * @param {number[]} rows Physical indexes of the skipped rows.
   * @param {'trimming'|'hiding'} mapType Kind of the index map that skips the rows.
   * @returns {ManualRowMove}
   */
  function createGrid(rows, mapType = 'trimming') {
    hot?.destroy();
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: Array.from({ length: 6 }, (_, index) => [`r${index}`]),
      manualRowMove: true,
    });

    const map = hot.rowIndexMapper.createAndRegisterIndexMap('test-skip', mapType);

    rows.forEach(row => map.setValueAtIndex(row, true));

    return hot.getPlugin('manualRowMove');
  }

  const sequence = () => hot.rowIndexMapper.getIndexesSequence();
  const visibleOrder = () => hot.rowIndexMapper.getRenderableIndexes().map(index => `r${index}`);

  describe('trimmed rows', () => {
    it('should place a row moved to the top after the trimmed rows that lead the grid', () => {
      const plugin = createGrid([0, 1]);

      // Visual rows are the physical rows 2, 3, 4, 5. Row `1` is the physical row 3.
      expect(plugin.moveRow(1, 0)).toBe(true);
      expect(sequence()).toEqual([0, 1, 3, 2, 4, 5]);
    });

    it('should place a row moved to the last position right after the last visible row, before the trailing trimmed rows', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveRow(0, 3)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
    });

    it('should place a row moved down before the visible row at the target position, after the trimmed block', () => {
      const plugin = createGrid([2, 3]);

      // Visual rows are the physical rows 0, 1, 4, 5. The target is the visual row 2 (the physical row 5).
      expect(plugin.moveRow(0, 2)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 4, 0, 5]);
    });

    it('should place a row moved up before the visible row at the target position, after the trimmed block', () => {
      const plugin = createGrid([2, 3]);

      expect(plugin.moveRow(3, 2)).toBe(true);
      expect(sequence()).toEqual([0, 1, 2, 3, 5, 4]);
    });

    it('should place a dragged row after the trimmed block that sits at the drop position', () => {
      const plugin = createGrid([2, 3]);

      // Dropping before the visual row 2 (the physical row 4) is the same gesture as `moveRow(0, 1)`.
      expect(plugin.dragRow(0, 2)).toBe(true);
      expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
    });

    describe('every single-row move around a trimmed block at the end of the grid', () => {
      // Visual rows are the physical rows 0, 1, 5. The rows 2, 3, 4 are trimmed and stay together.
      [
        { from: 0, to: 1, expected: [1, 2, 3, 4, 0, 5] },
        { from: 0, to: 2, expected: [1, 2, 3, 4, 5, 0] },
        { from: 1, to: 0, expected: [1, 0, 2, 3, 4, 5] },
        { from: 1, to: 2, expected: [0, 2, 3, 4, 5, 1] },
        { from: 2, to: 0, expected: [5, 0, 1, 2, 3, 4] },
        { from: 2, to: 1, expected: [0, 5, 1, 2, 3, 4] },
      ].forEach(({ from, to, expected }) => {
        it(`should place the result of moveRow(${from}, ${to}) at ${JSON.stringify(expected)}`, () => {
          const plugin = createGrid([2, 3, 4]);

          expect(plugin.moveRow(from, to)).toBe(true);
          expect(sequence()).toEqual(expected);
        });
      });
    });

    it('should place a block of rows moved to the last position right after the last visible row', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveRows([0, 1], 2)).toBe(true);
      expect(sequence()).toEqual([2, 3, 0, 1, 4, 5]);
    });

    it('should place a block of rows that stops short of the last position before the visible row at the target', () => {
      const plugin = createGrid([4, 5]);

      expect(plugin.moveRows([0, 1], 1)).toBe(true);
      expect(sequence()).toEqual([2, 0, 1, 3, 4, 5]);
    });

    it('should show the requested order once the trimmed rows are untrimmed, for the move to the last position', () => {
      const plugin = createGrid([4, 5]);

      plugin.moveRow(0, 3);
      hot.rowIndexMapper.unregisterMap('test-skip');

      expect(hot.getDataAtCol(0)).toEqual(['r1', 'r2', 'r3', 'r0', 'r4', 'r5']);
    });
  });

  describe('hidden rows', () => {
    /**
     * Drags the first row of a grid with the rows 2 and 3 hidden and returns the visible order.
     *
     * @param {number} dropIndex Visual drop index.
     * @returns {string[]}
     */
    function dragFirstRowAndReadVisibleOrder(dropIndex) {
      createGrid([2, 3], 'hiding').dragRow(0, dropIndex);

      return visibleOrder();
    }

    it('should give the same visible order for a drop on either side of a hidden block', () => {
      // The pointer between the renderable rows 1 and 2 resolves to the drop index 2 (lower half of the row
      // above the block) or 4 (upper half of the row below it). The physical order differs, the visible one does not.
      expect(dragFirstRowAndReadVisibleOrder(2)).toEqual(['r1', 'r0', 'r4', 'r5']);
      expect(dragFirstRowAndReadVisibleOrder(4)).toEqual(['r1', 'r0', 'r4', 'r5']);
    });
  });
});
