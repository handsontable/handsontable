import Handsontable from 'handsontable/base';
import { ManualRowMove, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ManualRowMove);

describe('ManualRowMove – a move that changes nothing, with trimmed rows', () => {
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
   * Creates a grid of 6 rows `r0`...`r5` with the given physical rows trimmed.
   *
   * @param {number[]} trimmedRows Physical indexes of the trimmed rows.
   * @param {object} settings Extra grid settings.
   * @returns {ManualRowMove}
   */
  function createGrid(trimmedRows, settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 6 }, (_, index) => [`r${index}`]),
      manualRowMove: true,
      ...settings,
    });

    const trimmingMap = hot.rowIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

    trimmedRows.forEach(row => trimmingMap.setValueAtIndex(row, true));

    return hot.getPlugin('manualRowMove');
  }

  const sequence = () => hot.rowIndexMapper.getIndexesSequence();

  it('should keep the order when a row is dragged onto its own position next to a trimmed row', () => {
    const plugin = createGrid([1]);

    expect(plugin.dragRow(0, 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a row is dropped right below itself next to a trimmed row', () => {
    const plugin = createGrid([1]);

    expect(plugin.dragRow(0, 1)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a row is moved to its own index next to a trimmed row', () => {
    const plugin = createGrid([1]);

    expect(plugin.moveRow(0, 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when a block of rows is moved onto its own position right before a trimmed row', () => {
    const plugin = createGrid([2]);

    // Visual rows 0 and 1 are physical 0 and 1, and physical row 2 is trimmed.
    expect(plugin.moveRows([0, 1], 0)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should keep the order when the row is moved onto its own position right before a trimmed row', () => {
    const plugin = createGrid([4]);

    // Visual row 3 is physical 3, and physical row 4 is trimmed.
    expect(plugin.moveRow(3, 3)).toBe(false);
    expect(sequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should not fire the sequence change hook for a move that changes nothing', () => {
    const plugin = createGrid([]);
    const afterRowSequenceChange = jest.fn();

    hot.addHook('afterRowSequenceChange', afterRowSequenceChange);

    expect(plugin.moveRow(0, 0)).toBe(false);
    expect(afterRowSequenceChange).not.toHaveBeenCalled();
  });

  it('should fire the sequence change hook for a move that changes the order', () => {
    const plugin = createGrid([]);
    const afterRowSequenceChange = jest.fn();

    hot.addHook('afterRowSequenceChange', afterRowSequenceChange);

    expect(plugin.moveRow(0, 2)).toBe(true);
    expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
  });

  it('should still fire both hooks for the move that changes nothing', () => {
    const beforeRowMove = jest.fn();
    const afterRowMove = jest.fn();
    const plugin = createGrid([1], { beforeRowMove, afterRowMove });

    plugin.dragRow(0, 0);

    expect(beforeRowMove).toHaveBeenCalledWith([0], 0, 0, true);
    expect(afterRowMove).toHaveBeenCalledWith([0], 0, 0, true, false);
  });

  it('should keep the untrimmed row in place when the rows are untrimmed from afterRowMove', () => {
    const plugin = createGrid([1], {
      afterRowMove() {
        hot.rowIndexMapper.unregisterMap('test-trim');
      },
    });

    plugin.dragRow(0, 0);

    expect(hot.getDataAtCol(0)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5']);
  });

  it('should keep the placement of a move that does change the order (no trimmed rows)', () => {
    const plugin = createGrid([]);

    expect(plugin.moveRow(0, 2)).toBe(true);
    expect(sequence()).toEqual([1, 2, 0, 3, 4, 5]);
  });

  it('should keep the placement of a move that does change the order (trimmed rows)', () => {
    const plugin = createGrid([1]);

    expect(plugin.moveRow(0, 2)).toBe(true);
    expect(sequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });
});
