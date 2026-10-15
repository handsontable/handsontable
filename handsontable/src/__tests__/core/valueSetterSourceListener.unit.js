import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

describe('setSourceDataAtCell with an `afterSetSourceDataAtCell` listener', () => {
  it('should call the `valueSetter` once per changed cell, and pass its result to the hook and the data', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const valueSetter = jest.fn(value => `Value: ${value}`);
    const afterSetSourceDataAtCell = jest.fn();
    const hot = new Handsontable(container, {
      data: [['A1', 'B1'], ['A2', 'B2']],
      valueSetter,
      afterSetSourceDataAtCell,
      autoRowSize: false,
      autoColumnSize: false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    valueSetter.mockClear();

    hot.setSourceDataAtCell([[0, 0, 'x'], [1, 1, 'y']]);

    // A listener used to make the `valueSetter` run twice: once for the hook's payload, once for the write.
    expect(valueSetter).toHaveBeenCalledTimes(2);
    expect(afterSetSourceDataAtCell).toHaveBeenCalledTimes(1);
    expect(afterSetSourceDataAtCell.mock.calls[0][0]).toEqual([[0, 0, 'A1', 'Value: x'], [1, 1, 'B2', 'Value: y']]);
    expect(hot.getSourceDataAtCell(0, 0)).toBe('Value: x');
    expect(hot.getSourceDataAtCell(1, 1)).toBe('Value: y');

    hot.destroy();
    container.remove();
  });

  it('should run each `valueSetter` right before its own write, with a listener or without one', () => {
    // AutoColumnSize, on by default, registers a listener in almost every grid.
    [{ autoColumnSize: false }, { autoColumnSize: true, afterSetSourceDataAtCell: jest.fn() }].forEach((extra) => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: [['old', '']],
        columns: [
          {},
          // Reads the value the same call wrote to the first column a step earlier.
          { valueSetter: value => `${value}+${hot.getSourceDataAtCell(0, 0)}` },
        ],
        autoRowSize: false,
        licenseKey: 'non-commercial-and-evaluation',
        ...extra,
      });

      expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(extra.autoColumnSize);

      hot.setSourceDataAtCell([[0, 0, 'new'], [0, 1, 'x']]);

      expect(hot.getSourceDataAtCell(0, 1)).toBe('x+new');

      if (extra.afterSetSourceDataAtCell) {
        // The payload carries the value the write stored.
        expect(extra.afterSetSourceDataAtCell.mock.calls[0][0]).toEqual([[0, 0, 'old', 'new'], [0, 1, '', 'x+new']]);
      }

      hot.destroy();
      container.remove();
    });
  });
});
