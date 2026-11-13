import Handsontable from 'handsontable/base';
import { registerPlugin, TrimRows, UndoRedo } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerPlugin(TrimRows);
registerPlugin(UndoRedo);

describe('Core#_setCellMetaByPhysicalIndex', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (__, col) => `${row}-${col}`)),
      trimRows: true,
      undo: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should write the key under the physical coordinates it is given', () => {
    hot.getPlugin('trimRows').trimRow(0);
    hot._setCellMetaByPhysicalIndex(1, 2, 'marker', 'x');

    // Physical row 1 is the first visible row once row 0 is trimmed.
    expect(hot.getCellMeta(0, 2).marker).toBe('x');
    expect(hot.getCellMeta(1, 2).marker).toBeUndefined();
  });

  it('should fire no cell meta hook and ignore a veto', () => {
    const before = jest.fn(() => false);
    const after = jest.fn();

    hot.addHook('beforeSetCellMeta', before);
    hot.addHook('afterSetCellMeta', after);
    hot._setCellMetaByPhysicalIndex(0, 0, 'marker', 'x');

    expect(hot.getCellMeta(0, 0).marker).toBe('x');
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it('should be journaled for undo like `setCellMeta()`', () => {
    hot._setCellMetaByPhysicalIndex(0, 0, 'marker', 'x');
    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(0, 0).marker).toBeUndefined();
  });
});
