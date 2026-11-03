import Handsontable from 'handsontable/base';
import { ManualColumnMove, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ManualColumnMove);

describe('ManualColumnMove – a move that changes nothing, with trimmed columns', () => {
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
   * Creates a grid of 6 columns `c0`...`c5` with the given physical columns trimmed.
   *
   * @param {number[]} trimmedColumns Physical indexes of the trimmed columns.
   * @param {object} settings Extra grid settings.
   * @returns {ManualColumnMove}
   */
  function createGrid(trimmedColumns, settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [Array.from({ length: 6 }, (_, index) => `c${index}`)],
      manualColumnMove: true,
      ...settings,
    });

    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

    trimmedColumns.forEach(column => trimmingMap.setValueAtIndex(column, true));

    return hot.getPlugin('manualColumnMove');
  }

  const sequence = () => hot.columnIndexMapper.getIndexesSequence();

  it('should keep the order when a column is dragged onto its own position next to a trimmed column', () => {
    const plugin = createGrid([1]);

    expect(plugin.dragColumn(0, 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a column is dropped right after itself next to a trimmed column', () => {
    const plugin = createGrid([1]);

    expect(plugin.dragColumn(0, 1)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a column is moved to its own index next to a trimmed column', () => {
    const plugin = createGrid([1]);

    expect(plugin.moveColumn(0, 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a block of columns is moved onto its own position right before a trimmed column', () => {
    const plugin = createGrid([2]);

    // Visual columns 0 and 1 are physical 0 and 1, and physical column 2 is trimmed.
    expect(plugin.moveColumns([0, 1], 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when the column is moved onto its own position right before a trimmed column', () => {
    const plugin = createGrid([4]);

    // Visual column 3 is physical 3, and physical column 4 is trimmed.
    expect(plugin.moveColumn(3, 3)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should not fire the sequence change hook for a move that changes nothing', () => {
    const plugin = createGrid([]);
    const afterColumnSequenceChange = jest.fn();

    hot.addHook('afterColumnSequenceChange', afterColumnSequenceChange);

    expect(plugin.moveColumn(0, 0)).toBe(false);
    expect(afterColumnSequenceChange).not.toHaveBeenCalled();
  });

  it('should fire the sequence change hook for a move that changes the order', () => {
    const plugin = createGrid([]);
    const afterColumnSequenceChange = jest.fn();

    hot.addHook('afterColumnSequenceChange', afterColumnSequenceChange);

    expect(plugin.moveColumn(0, 2)).toBe(true);
    expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
  });

  it('should still fire both hooks for the move that changes nothing', () => {
    const beforeColumnMove = jest.fn();
    const afterColumnMove = jest.fn();
    const plugin = createGrid([1], { beforeColumnMove, afterColumnMove });

    plugin.dragColumn(0, 0);

    expect(beforeColumnMove).toHaveBeenCalledWith([0], 0, 0, true);
    expect(afterColumnMove).toHaveBeenCalledWith([0], 0, 0, true, false);
  });

  it('should keep the placement of a move that does change the order (no trimmed columns)', () => {
    const plugin = createGrid([]);

    expect(plugin.moveColumn(0, 2)).toBe(true);
    expect(sequence()).toEqual([1, 2, 0, 3, 4, 5]);
  });

  it('should keep the placement of a move that does change the order (trimmed columns)', () => {
    const plugin = createGrid([1]);

    expect(plugin.moveColumn(0, 2)).toBe(true);
    expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });
});
