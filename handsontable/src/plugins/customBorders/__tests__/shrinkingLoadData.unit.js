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
   * Builds an 8x8 grid with a border on its last cell, then loads a 3x3 dataset over it.
   *
   * @returns {object} The Handsontable instance.
   */
  function shrink() {
    hot = new Handsontable(container, {
      data: square(8),
      customBorders: [{ row: 7, col: 7, top: { width: 2, color: 'red' } }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.loadData(square(3));

    return hot;
  }

  it('should not throw when the customBorders setting is emptied', () => {
    // The plugin registers no `afterLoadData` hook, so `savedBorders` still holds `{ row: 7, col: 7 }`
    // while the grid is 3x3. Clearing the model then asked `removeCellMeta` about a cell that no
    // longer exists, and the meta manager's index assertion took the whole call down with
    // "Expecting an unsigned number".
    shrink();

    expect(() => hot.updateSettings({ customBorders: [] })).not.toThrow();
    expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
  });

  it('should not throw when the customBorders setting is replaced with an in-range entry', () => {
    shrink();

    expect(() => hot.updateSettings({
      customBorders: [{ row: 0, col: 0, top: { width: 1, color: 'blue' } }],
    })).not.toThrow();

    const borders = hot.getPlugin('customBorders').getBorders();

    expect(borders).toHaveLength(1);
    expect(borders[0].row).toBe(0);
    expect(borders[0].col).toBe(0);
  });

  it('should not throw when clearBorders() is called', () => {
    shrink();

    expect(() => hot.getPlugin('customBorders').clearBorders()).not.toThrow();
    expect(hot.getPlugin('customBorders').getBorders()).toEqual([]);
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
});
